import {
  VotableItem,
  VoteOption,
  Proposal,
  UIProposal,
  UIVotableItem,
  UIAddVoterVotableItem,
  IsUIAddVoterVotableItem,
  IsAddVoterVotableItem,
} from "../../../types/proposal";
import { ethers } from "ethers";
import { ProposalFileService } from "../../file-upload";
import {
  convertVoteOptionToGovernor,
  getTransferTokenCalldata,
} from "../../utils";
import { ProposalWriter } from "../proposal-service";
import {
  DuplicateProposalError,
  ExecuteFailedError,
  IneligibleProposerError,
  IneligibleVoterError,
} from "../../../types/proposal-service-errors";
import { BlockchainProposalParser } from "./blockchain-proposal-parser";
import { BlockchainProposalReader } from "./blockchain-proposal-reader";
import { EvsdGovernor, EvsdToken } from "@/typechain-types";
import { UserService } from "@/lib/user-services/user-service";

export class BlockchainProposalWriter implements ProposalWriter {
  private readonly governor: EvsdGovernor;
  private readonly token: EvsdToken;
  private readonly parser: BlockchainProposalParser;
  private readonly signer: ethers.Signer;
  private readonly blockchainReader: BlockchainProposalReader;

  constructor(
    governor: EvsdGovernor,
    token: EvsdToken,
    signer: ethers.Signer,
    fileService: ProposalFileService,
    userService: UserService,
    blockchainReader: BlockchainProposalReader
  ) {
    this.governor = governor;
    this.token = token;
    this.parser = new BlockchainProposalParser(
      this.governor,
      fileService,
      userService
    );
    this.signer = signer;
    this.blockchainReader = blockchainReader;
  }
  async acceptVotingRights(): Promise<void> {
    const signerAddress = await this.signer.getAddress();
    const balance = await this.token.balanceOf(signerAddress);
    const currentVotingPower = await this.token.getVotes(signerAddress);

    const needsToExecute = balance === 0n;
    const needsToDelegate = currentVotingPower === 0n;
    if (needsToExecute) {
      const proposalToExecute =
        await this.blockchainReader.getProposalToAddUser(signerAddress);
      if (proposalToExecute) {
        await this.executeItem(proposalToExecute, 0);
      }
    }

    if (needsToDelegate) {
      await this.token.delegate(await this.signer.getAddress());
    }
  }

  public async cancelProposal(proposal: Proposal): Promise<boolean> {
    try {
      const description = await this.parser.serializeProposal(proposal);
      const descriptionHash = ethers.id(description);

      const governorAddress = await this.governor.getAddress();
      const doNothingCalldata =
        this.governor.interface.encodeFunctionData("doNothing");

      const tx = await this.governor.cancel(
        [governorAddress],
        [0],
        [doNothingCalldata],
        descriptionHash
      );
      await tx.wait();

      return true;
    } catch (error) {
      console.error("Greška pri otkazivanju predloga:", error);
      return false;
    }
  }

  private async createProposalAddVoter(
    item: UIAddVoterVotableItem,
    parentProposalId: bigint
  ): Promise<bigint> {
    const tokenAddress = await this.token.getAddress();
    const newVoterAddress = item.newVoterAddress;
    const transferCalldata = await getTransferTokenCalldata(
      this.token,
      newVoterAddress
    );
    const descriptionSerialized = this.parser.serializeVotableItem(
      item,
      parentProposalId,
      0
    );

    const tx = await this.governor.propose(
      [tokenAddress],
      [0],
      [transferCalldata],
      descriptionSerialized
    );
    const receipt = (await tx.wait())!;
    for (const log of receipt.logs) {
      try {
        const parsed = this.governor.interface.parseLog(log);
        if (parsed?.name === "ProposalCreated") {
          return parsed.args.proposalId;
        }
      } catch (err) {
        // This log might not match the contract interface, ignore it
        console.log(err);
      }
    }

    throw new Error("Failed to find proposalId in the transaction receipt");
  }
  // Creates a proposal on-chain that invokes the do nothing method of the contract. Returns the proposal id
  private async createProposalDoNothing(description: string): Promise<bigint> {
    const governorAddress = await this.governor.getAddress();
    const doNothingCalldata =
      this.governor.interface.encodeFunctionData("doNothing");

    try {
      const tx = await this.governor.propose(
        [governorAddress],
        [0],
        [doNothingCalldata],
        description
      );
      const receipt = (await tx.wait())!;
      for (const log of receipt.logs) {
        try {
          const parsed = this.governor.interface.parseLog(log);
          if (parsed?.name === "ProposalCreated") {
            return parsed.args.proposalId;
          }
        } catch (err) {
          // This log might not match the contract interface, ignore it
          console.log(err);
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        // Hacky solution todo: find a proper way to do this
        if (err.message.includes("GovernorInsufficientProposerVotes")) {
          throw new IneligibleProposerError("ne znam koji XD");
        }
      } else {
        throw new Error(
          `Proposal creation failed with an unknown error: ${err}`
        );
      }
    }
    throw new Error("Failed to find proposalId in the transaction receipt");
  }
  private async uploadVotableItem(
    item: UIVotableItem | UIAddVoterVotableItem,
    parentId: bigint,
    index: number
  ) {
    if (IsUIAddVoterVotableItem(item)) {
      await this.createProposalAddVoter(item, parentId);
    } else {
      await this.createProposalDoNothing(
        this.parser.serializeVotableItem(item, parentId, index)
      );
    }
  }
  public async uploadProposal(proposal: UIProposal) {
    if (await this.blockchainReader.proposalAlreadyPresent(proposal)) {
      throw new DuplicateProposalError("Proposal already present");
    }
    const serializedProposal = await this.parser.serializeProposal(proposal);

    const proposalId = await this.createProposalDoNothing(serializedProposal);
    const uploadPromises = proposal.voteItems.map((voteItem, index) =>
      this.uploadVotableItem(voteItem, proposalId, index)
    );
    await Promise.all(uploadPromises);
    return proposalId;
  }
  public async voteForItem(item: VotableItem, vote: VoteOption) {
    const address = await this.signer.getAddress();
    const tokenBalance = await this.token.balanceOf(address);
    if (tokenBalance === BigInt(0)) {
      throw new IneligibleVoterError(address);
    } else {
      const voteGovernor = convertVoteOptionToGovernor(vote);
      await this.governor.castVote(item.id, voteGovernor);
    }
  }
  // Call to execute a proposal item that has completed with a passed vote status
  // Currently only executes add voter proposals
  public async executeItem(proposal: Proposal, itemIndex: number) {
    const item = proposal.voteItems[itemIndex];
    if (IsAddVoterVotableItem(item)) {
      const description = this.parser.serializeVotableItem(
        item,
        proposal.id,
        itemIndex
      );
      const descriptionHash = ethers.id(description);

      const tokenAddress = await this.token.getAddress();
      const calldata = await getTransferTokenCalldata(
        this.token,
        item.newVoterAddress
      );

      try {
        const tx = await this.governor.execute(
          [tokenAddress],
          [0],
          [calldata],
          descriptionHash
        );

        await tx.wait();
      } catch (err) {
        if (err instanceof Error) {
          throw new ExecuteFailedError(err.message);
        } else {
          throw new ExecuteFailedError("Execute failed for an unknown reason");
        }
      }
    } else {
      throw new ExecuteFailedError(
        "Execute called on an unsupported vote item type."
      );
    }
  }
}
