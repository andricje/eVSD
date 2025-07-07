import { ethers } from "ethers";
import {
  onProposalsChangedUnsubscribe,
  ProposalReader,
} from "../proposal-service";
import {
  AddVoterVotableItem,
  IsAddVoterVotableItem,
  Proposal,
  UIProposal,
  User,
  UserVotingStatus,
  VotableItem,
  VoteEvent,
} from "../../../types/proposal";
import {
  areProposalsEqual,
  getMintTokenCalldata,
  getNewVoterProposalDescription,
  getVoteResultForItem,
} from "../../utils";
import {
  BlockchainProposalParser,
  isAddVoterVotableItemChainData,
  isProposalChainData,
  isVotableItemChainData,
  ProposalCreatedEventArgs,
} from "./blockchain-proposal-parser";
import { InMemoryProposalFileService } from "../../file-upload";
import { BlockchainEventProvider } from "./blockchain-event-provider";
import { EvsdGovernor, EvsdToken } from "../../../typechain-types";
import { ProposalCreatedEvent } from "../../../typechain-types/contracts/EvsdGovernor";
import { UserService } from "@/lib/user-services/user-service";

export class BlockchainProposalReader implements ProposalReader {
  private readonly governor: EvsdGovernor;
  private readonly token: EvsdToken;
  private readonly parser: BlockchainProposalParser;
  private readonly eventProvider: BlockchainEventProvider;

  constructor(
    governor: EvsdGovernor,
    token: EvsdToken,
    provider: ethers.Provider,
    userService: UserService
  ) {
    this.governor = governor;
    this.token = token;
    this.parser = new BlockchainProposalParser(
      this.governor,
      new InMemoryProposalFileService(),
      userService
    );
    this.eventProvider = new BlockchainEventProvider(
      governor,
      provider,
      userService
    );
  }
  async getUserVotingStatus(user: User): Promise<UserVotingStatus> {
    const currentVotingPower = await this.token.getVotes(user.address);
    const tokenBalance = await this.token.balanceOf(user.address);
    // User already has some voting power so we assume there is nothing to accept or delegate
    if (currentVotingPower > 0n) {
      return "Eligible";
    }
    const proposalToAddUser = await this.getProposalToAddUser(user.address);
    // Either there is a proposal to add the user (the user has 0 tokens and 0 voting power but will obtain tokens when the proposal is executed)
    // or the user has some tokens but failed to delegate the tokens to themselves (or is one of the users that had tokens minted to them on contract deployment)
    if (proposalToAddUser || (tokenBalance > 0n && currentVotingPower === 0n)) {
      return "CanAcceptVotingRights";
    }
    return "NotEligible";
  }
  async getProposalToAddUser(userAddress: string): Promise<Proposal | null> {
    const allProposals = await this.getProposals();
    // Find the proposal that adds the current signer that has vote result passed (if it exists)
    for (const proposal of allProposals) {
      // Avoid malformed proposals
      if (proposal.voteItems.length === 0) {
        continue;
      }
      const voteItem = proposal.voteItems[0];
      const isAddVoter = IsAddVoterVotableItem(voteItem);
      const voteResult = getVoteResultForItem(voteItem);
      if (
        isAddVoter &&
        proposal.status === "closed" &&
        voteResult === "passed" &&
        voteItem.newVoterAddress === userAddress
      ) {
        return proposal;
      }
    }
    return null;
  }

  private async handleChainEvent(
    args: ProposalCreatedEvent.OutputTuple & ProposalCreatedEvent.OutputObject,
    proposals: Proposal[],
    voteEventsForId: Record<string, VoteEvent[]>,
    voteItemsForProposalId: Record<
      string,
      {
        item: VotableItem | AddVoterVotableItem;
        index: number;
      }[]
    >
  ) {
    const proposalCreatedArgs: ProposalCreatedEventArgs = {
      proposalId: args.proposalId,
      voteStart: args.voteStart,
      proposerAddress: args.proposer,
    };

    // All serializable data is stored as a json string inside the proposal description
    const deserializedData = this.parser.deserializeChainData(args.description);
    if (isProposalChainData(deserializedData)) {
      const proposal = await this.parser.parseProposal(
        deserializedData,
        proposalCreatedArgs
      );
      proposals.push(proposal);
    } else if (isAddVoterVotableItemChainData(deserializedData)) {
      // TODO: Verify args[3] is values or even better unpack the event in a better way
      this.isProposalAddVoter(args.calldatas, args.targets, args[3]);
      const addVoterItem = await this.parser.parseAddVoterVotableItem(
        deserializedData,
        proposalCreatedArgs,
        voteEventsForId
      );

      if (!voteItemsForProposalId[deserializedData.parentProposalId]) {
        voteItemsForProposalId[deserializedData.parentProposalId] = [];
      }
      voteItemsForProposalId[deserializedData.parentProposalId].push({
        item: addVoterItem,
        index: deserializedData.index,
      });
    } else if (isVotableItemChainData(deserializedData)) {
      const votableItem = await this.parser.parseVotableItem(
        deserializedData,
        proposalCreatedArgs,
        voteEventsForId
      );

      if (!voteItemsForProposalId[deserializedData.parentProposalId]) {
        voteItemsForProposalId[deserializedData.parentProposalId] = [];
      }
      voteItemsForProposalId[deserializedData.parentProposalId].push({
        item: votableItem,
        index: deserializedData.index,
      });
    } else {
      throw new Error(`Unknown chain data type: ${deserializedData.type}`);
    }
  }

  public async getProposals(): Promise<Proposal[]> {
    const proposalCreatedFilter = this.governor.filters.ProposalCreated();
    const events = await this.governor.queryFilter(
      proposalCreatedFilter,
      0,
      "latest"
    );

    const proposals: Proposal[] = [];
    const voteItemsForProposalId: Record<
      string,
      { item: VotableItem | AddVoterVotableItem; index: number }[]
    > = {};
    const allVoteEvents = await this.eventProvider.getAllVoteEvents();
    const voteEventsForId = allVoteEvents.reduce<Record<string, VoteEvent[]>>(
      (acc, item) => {
        const proposalId = item.proposalId.toString();
        if (!acc[proposalId]) {
          acc[proposalId] = [];
        }
        acc[proposalId].push(item.voteEvent);
        return acc;
      },
      {}
    );

    // First process all events - parse either a VotableItem or a Proposal
    for (const event of events) {
      const args = event.args;
      if (!args) {
        continue;
      }
      try {
        await this.handleChainEvent(
          args,
          proposals,
          voteEventsForId,
          voteItemsForProposalId
        );
      } catch (err) {
        console.error(
          `Failed to handle chain event. Failed with error: ${err}`
        );
      }
    }
    // Pair child VoteItems with Proposals
    for (const proposal of proposals) {
      const proposalId = proposal.id.toString();

      proposal.voteItems = [];
      if (proposalId in voteItemsForProposalId) {
        // Ensure the vote items are ordered correctly
        const voteItemsCorrectOrder = voteItemsForProposalId[proposalId].sort(
          (lhs, rhs) => {
            return lhs.index - rhs.index;
          }
        );
        proposal.voteItems = voteItemsCorrectOrder.map((x) => x.item);
      }
    }
    // Override proposal title and description for proposals that add new voters
    for (const proposal of proposals) {
      if (
        proposal.voteItems.length > 0 &&
        IsAddVoterVotableItem(proposal.voteItems[0])
      ) {
        const { title } = getNewVoterProposalDescription(
          proposal.voteItems[0].newVoterAddress,
          proposal.voteItems[0].newVoterName
        );
        proposal.title = title;
        proposal.description = "";
      }
    }
    return proposals;
  }

  public async getProposal(id: bigint): Promise<Proposal> {
    const allProposals = await this.getProposals();
    const proposal = allProposals.find((proposal) => proposal.id === id);
    if (!proposal) {
      throw new Error("Invalid proposal id");
    }
    return proposal;
  }

  public onProposalsChanged(
    callback: (newProposals: Proposal[]) => void
  ): onProposalsChangedUnsubscribe {
    const onProposalChangedCallback = async () => {
      const proposals = await this.getProposals();
      callback(proposals);
    };
    this.governor.on(
      this.governor.filters.ProposalCreated,
      onProposalChangedCallback
    );
    this.governor.on(this.governor.filters.VoteCast, onProposalChangedCallback);
    this.governor.on(
      this.governor.filters.ProposalCanceled,
      onProposalChangedCallback
    );
    this.governor.on(
      this.governor.filters.ProposalExecuted,
      onProposalChangedCallback
    );
    return () => this.governor.removeAllListeners();
  }

  public async proposalAlreadyPresent(newProposal: UIProposal) {
    const allProposals = await this.getProposals();
    for (const proposal of allProposals) {
      if (await areProposalsEqual(newProposal, proposal)) {
        return true;
      }
    }
    return false;
  }

  // Checks whether this is a proposal to add a voter based on the calldata and the address
  private async isProposalAddVoter(
    callDatas: string[],
    targets: string[],
    values: bigint[]
  ) {
    // There should be only one element which is zero in the values array
    if (values.length !== 1 || values[0] !== BigInt(0)) {
      return false;
    }

    // The only address should be the token address
    const tokenAddress = await this.token.getAddress();
    const targetsCorrect = targets.length === 1 && targets[0] === tokenAddress;
    if (!targetsCorrect) {
      return false;
    }

    // There should be only one call data
    const numberOfCalldatasCorrect = callDatas.length === 1;
    if (!numberOfCalldatasCorrect) {
      return false;
    }
    // The call data should be the transfer method and have 2 args - the address and amount
    const args = this.token.interface.decodeFunctionData(
      "transfer",
      callDatas[0]
    );
    const numberOfArgsCorrect = args.length === 2;
    if (!numberOfArgsCorrect) {
      return false;
    }
    const addr = args[0];
    // Use this address to construct the correct calldata and compare
    const correctCalldata = await getMintTokenCalldata(this.token, addr);

    return callDatas[0] === correctCalldata;
  }
}
