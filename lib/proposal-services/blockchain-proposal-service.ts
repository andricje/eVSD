import {
  VotableItem,
  VoteOption,
  Proposal,
  VoteEvent,
  UIProposal,
  UIVotableItem,
  UIAddVoterVotableItem,
  IsUIAddVoterVotableItem,
  AddVoterVotableItem,
  IsAddVoterVotableItem,
} from "../../types/proposal";
import { ethers, EventLog } from "ethers";
import { ProposalFileService, fileToDigestHex } from "../file-upload";
import {
  convertAddressToName,
  governorVoteMap,
  getNewVoterProposalDescription,
  convertVoteOptionToGovernor,
  convertGovernorState,
  areProposalsEqual,
  getVoteResult,
  getVoteResultForItem,
} from "../utils";
import evsdGovernorArtifacts from "../../contracts/evsd-governor.json";
import evsdTokenArtifacts from "../../contracts/evsd-token.json";
import { ProposalService } from "./proposal-service";
import {
  DuplicateProposalError,
  ExecuteFailedError,
  IneligibleProposerError,
  IneligibleVoterError,
} from "../../types/proposal-service-errors";
import {
  UserActivityEventProposal,
  UserActivityEventVote,
} from "@/components/user-activity/user-activity";

export type onProposalsChangedUnsubscribe = () => void;
type UserVotingStatus = "NotEligible" | "CanAcceptVotingRights" | "Eligible";
export class BlockchainProposalService implements ProposalService {
  private readonly governor: ethers.Contract;
  private readonly token: ethers.Contract;
  private readonly fileService: ProposalFileService;
  private readonly signer: ethers.Signer;
  private readonly provider: ethers.Provider;
  private readonly tokenAddress: string;
  private readonly governorAddress: string;
  constructor(
    signer: ethers.Signer,
    fileService: ProposalFileService,
    provider: ethers.Provider,
    governorAddress?: string,
    tokenAddress?: string
  ) {
    this.governorAddress = governorAddress
      ? governorAddress
      : evsdGovernorArtifacts.address;
    this.tokenAddress = tokenAddress
      ? tokenAddress
      : evsdTokenArtifacts.address;
    this.governor = new ethers.Contract(
      this.governorAddress,
      evsdGovernorArtifacts.abi,
      signer
    );
    this.token = new ethers.Contract(
      this.tokenAddress,
      evsdTokenArtifacts.abi,
      signer
    );
    this.fileService = fileService;
    this.signer = signer;
    this.provider = provider;
  }
  async getProposalToAddCurrentUser(): Promise<Proposal | null> {
    const signerAddress = await this.signer.getAddress();
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
        voteItem.newVoterAddress === signerAddress
      ) {
        return proposal;
      }
    }
    return null;
  }
  async getCurrentUserVotingStatus(): Promise<UserVotingStatus> {
    const signerAddress = await this.signer.getAddress();
    const currentVotingPower = await this.token.getVotes(signerAddress);
    if (currentVotingPower > 0n) {
      return "Eligible";
    } else if (await this.getProposalToAddCurrentUser()) {
      return "CanAcceptVotingRights";
    }
    return "NotEligible";
  }
  async canCurrentUserAcceptVotingRights(): Promise<boolean> {
    return (
      (await this.getCurrentUserVotingStatus()) === "CanAcceptVotingRights"
    );
  }
  async acceptVotingRights(): Promise<void> {
    const signerAddress = await this.signer.getAddress();
    const balance = await this.token.balanceOf(signerAddress);
    const currentVotingPower = await this.token.getVotes(signerAddress);

    const needsToExecute = balance === 0n;
    const needsToDelegate = currentVotingPower === 0n;
    if (needsToExecute) {
      const proposalToExecute = await this.getProposalToAddCurrentUser();
      if (proposalToExecute) {
        await this.executeItem(proposalToExecute, 0);
      }
    }

    if (needsToDelegate) {
      await this.token.delegate(await this.signer.getAddress());
    }
  }

  onProposalsChanged(
    callback: (newProposals: Proposal[]) => void
  ): onProposalsChangedUnsubscribe {
    const onProposalChangedCallback = async () => {
      const proposals = await this.getProposals();
      callback(proposals);
    };
    this.governor.on("ProposalCreated", onProposalChangedCallback);
    this.governor.on("VoteCast", onProposalChangedCallback);
    this.governor.on("ProposalCanceled", onProposalChangedCallback);
    this.governor.on("ProposalExecuted", onProposalChangedCallback);
    return () => this.governor.removeAllListeners();
  }
  async cancelProposal(proposal: Proposal): Promise<boolean> {
    try {
      const description = await this.serializeProposal(proposal);
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
  async getProposal(id: bigint): Promise<Proposal> {
    const allProposals = await this.getProposals();
    const proposal = allProposals.find((proposal) => proposal.id === id);
    if (!proposal) {
      throw new Error("Invalid proposal id");
    }
    return proposal;
  }
  async getProposals(): Promise<Proposal[]> {
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
    const allVoteEvents = await this.getAllVoteEvents();
    const voteEventsForId = allVoteEvents.reduce<Record<string, VoteEvent[]>>(
      (acc, item) => {
        if (!acc[item.proposalId]) {
          acc[item.proposalId] = [];
        }
        acc[item.proposalId].push(item.voteEvent);
        return acc;
      },
      {}
    );

    // First process all events - parse either a VotableItem or a Proposal
    for (const event of events) {
      const args = (event as EventLog).args;
      if (!args) {
        continue;
      }

      // All serializable data is stored as a json string inside the proposal description
      const deserializedData = this.deserializeChainData(args.description);
      if (deserializedData.type === "proposal") {
        const proposal = await this.parseProposal(deserializedData, args);
        if (!proposal) {
          continue;
        }
        proposals.push(proposal);
      } else if (deserializedData.type === "voteItem") {
        const voteItemData = deserializedData as VotableItemSerializationData;
        const votableItem = await this.parseVotableItem(
          voteItemData,
          args,
          voteEventsForId
        );
        if (!votableItem) {
          continue;
        }
        // Add to the map
        if (!voteItemsForProposalId[voteItemData.parentProposalId]) {
          voteItemsForProposalId[voteItemData.parentProposalId] = [];
        }
        voteItemsForProposalId[voteItemData.parentProposalId].push({
          item: votableItem,
          index: voteItemData.index,
        });
      } else if (deserializedData.type === "addVoterVoteItem") {
        // TODO: Verify args[3] is values or even better unpack the event in a better way
        this.isProposalAddVoter(args.calldatas, args.targets, args[3]);
        const voteItemData =
          deserializedData as AddVoterVotableItemSerializationData;
        const addVoterItem = await this.parseAddVoterVotableItem(
          voteItemData,
          args,
          voteEventsForId
        );
        if (!addVoterItem) {
          continue;
        }
        // Add to the map
        if (!voteItemsForProposalId[voteItemData.parentProposalId]) {
          voteItemsForProposalId[voteItemData.parentProposalId] = [];
        }
        voteItemsForProposalId[voteItemData.parentProposalId].push({
          item: addVoterItem,
          index: voteItemData.index,
        });
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
    return proposals;
  }
  async getAllUserActivity(): Promise<
    (UserActivityEventVote | UserActivityEventProposal)[]
  > {
    const currentUserAddress = await this.signer.getAddress();
    const currentUserProposals = (await this.getProposals()).filter(
      (proposal) => proposal.author.address === currentUserAddress
    );

    const createEvents = currentUserProposals.map((proposal) => {
      const proposalCreateEvt: UserActivityEventProposal = {
        type: "Create",
        proposal,
        date: proposal.dateAdded,
      };
      return proposalCreateEvt;
    });

    const voteEventsWithId = await this.getAllVoteEvents();
    const voteEvents: UserActivityEventVote[] = [];
    for (const x of voteEventsWithId) {
      for (const proposal of currentUserProposals) {
        const voteItem = proposal.voteItems.find(
          (voteItem) => voteItem.id === BigInt(x.proposalId)
        );
        if (voteItem) {
          const evt: UserActivityEventVote = {
            voteEvent: x.voteEvent,
            proposal,
            voteItem,
            date: x.voteEvent.date,
          };
          voteEvents.push(evt);
        }
      }
    }

    const cancelEventsWithId = await this.getAllCancelEvents();
    const cancelEvents: UserActivityEventProposal[] = [];
    for (const x of cancelEventsWithId) {
      const proposal = currentUserProposals.find(
        (proposal) => proposal.id === BigInt(x.proposalId)
      );
      if (proposal) {
        const evt: UserActivityEventProposal = {
          proposal,
          type: "Delete",
          date: x.date,
        };
        cancelEvents.push(evt);
      }
    }

    return [...createEvents, ...voteEvents, ...cancelEvents];
  }
  private async getAllVoteEvents() {
    const filter = this.governor.filters.VoteCast();
    const events = await this.governor.queryFilter(filter, 0, "latest");

    const votingHistory = events.map(async (event) => {
      const args = (event as EventLog).args;
      if (!args) {
        return undefined;
      }
      const vote = Number(args.support);
      const block = await this.provider.getBlock(event.blockNumber);
      const voteEvent = {
        vote: governorVoteMap[vote],
        date: new Date(block ? block.timestamp * 1000 : 0),
        voter: { address: args.voter, name: convertAddressToName(args.voter) },
      } as VoteEvent;
      return {
        proposalId: args.proposalId,
        voteEvent,
      };
    });
    return (await Promise.all(votingHistory)).filter(
      (item) => item !== undefined
    );
  }
  private async getAllCancelEvents() {
    const filter = this.governor.filters.ProposalCanceled();
    const events = await this.governor.queryFilter(filter, 0, "latest");

    const votingHistory = events.map(async (event) => {
      const args = (event as EventLog).args;
      if (!args) {
        return undefined;
      }

      const block = await this.provider.getBlock(event.blockNumber);
      const date = new Date(block ? block.timestamp * 1000 : 0);
      return {
        proposalId: args.proposalId.toString(),
        date,
      };
    });
    return (await Promise.all(votingHistory)).filter(
      (item) => item !== undefined
    );
  }
  private async getTransferTokenCalldata(newVoterAddress: string) {
    const decimals = await this.token.decimals();
    const oneToken = ethers.parseUnits("1", decimals);
    const transferCalldata = this.token.interface.encodeFunctionData(
      "transfer",
      [newVoterAddress, oneToken]
    );
    return transferCalldata;
  }
  async createProposalAddVoter(
    item: UIAddVoterVotableItem,
    parentProposalId: bigint
  ): Promise<bigint> {
    const newVoterAddress = item.newVoterAddress;
    const transferCalldata = this.getTransferTokenCalldata(newVoterAddress);
    const descriptionSerialized = this.serializeVotableItem(
      item,
      parentProposalId,
      0
    );

    const tx = await this.governor.propose(
      [this.tokenAddress],
      [0],
      [transferCalldata],
      descriptionSerialized
    );
    const receipt = await tx.wait();
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
      const receipt = await tx.wait();
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
          throw new IneligibleProposerError(await this.signer.getAddress());
        }
      } else {
        throw new Error(
          `Proposal creation failed with an unknown error: ${err}`
        );
      }
    }
    throw new Error("Failed to find proposalId in the transaction receipt");
  }
  async uploadVotableItem(
    item: UIVotableItem | UIAddVoterVotableItem,
    parentId: bigint,
    index: number
  ) {
    if (IsUIAddVoterVotableItem(item)) {
      await this.createProposalAddVoter(item, parentId);
    } else {
      await this.createProposalDoNothing(
        this.serializeVotableItem(item, parentId, index)
      );
    }
  }
  async uploadProposal(proposal: UIProposal) {
    if (await this.proposalAlreadyPresent(proposal)) {
      throw new DuplicateProposalError("Proposal already present");
    }
    const serializedProposal = await this.serializeProposal(proposal);

    const proposalId = await this.createProposalDoNothing(serializedProposal);
    const uploadPromises = proposal.voteItems.map((voteItem, index) =>
      this.uploadVotableItem(voteItem, proposalId, index)
    );
    await Promise.all(uploadPromises);
    return proposalId;
  }
  async voteForItem(item: VotableItem, vote: VoteOption) {
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
  async executeItem(proposal: Proposal, itemIndex: number) {
    const item = proposal.voteItems[itemIndex];
    if (IsAddVoterVotableItem(item)) {
      const description = this.serializeVotableItem(
        item,
        proposal.id,
        itemIndex
      );
      const descriptionHash = ethers.id(description);

      const tokenAddress = await this.token.getAddress();
      const calldata = await this.getTransferTokenCalldata(
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
  private async proposalAlreadyPresent(newProposal: UIProposal) {
    const allProposals = await this.getProposals();
    for (const proposal of allProposals) {
      if (await areProposalsEqual(newProposal, proposal)) {
        return true;
      }
    }
    return false;
  }
  deserializeChainData(data: string): SerializationData {
    return JSON.parse(data) as SerializationData;
  }
  private async parseProposal(
    deserializedData: SerializationData,
    args: ethers.Result
  ): Promise<Proposal | undefined> {
    const proposalId = args.proposalId;
    const voteStart = new Date(Number(args.voteStart) * 1000);
    const stateIndex = Number(
      (await this.governor.state(proposalId)) as bigint
    );
    const proposalState = convertGovernorState(stateIndex);
    const deadline = await this.governor.proposalDeadline(proposalId);
    const closesAt = new Date(Number(deadline) * 1000);
    // Create a proposal with an empty itemsToVote array - it will be filled after all of the VotableItems arrive
    const proposalData = deserializedData as ProposalSerializationData;
    return {
      id: proposalId,
      title: proposalData.title,
      description: proposalData.description,
      author: {
        address: args.proposer,
        name: convertAddressToName(args.proposer),
      },
      file:
        proposalData.fileHash !== ""
          ? await this.fileService.fetch(proposalData.fileHash)
          : undefined,
      dateAdded: voteStart,
      status: proposalState,
      closesAt: closesAt,
      voteItems: [],
    };
  }
  private async parseVotableItem(
    deserializedData: VotableItemSerializationData,
    args: ethers.Result,
    voteEventsForId: Record<string, VoteEvent[]>
  ): Promise<VotableItem | undefined> {
    const proposalId = args.proposalId;
    const proposalIdStr = proposalId.toString();

    // Convert an array of VoteEvents into a map of voter -> voteEvent
    const votesForAddress =
      proposalIdStr in voteEventsForId
        ? voteEventsForId[proposalIdStr].reduce<Map<string, VoteEvent>>(
            (acc, item) => {
              acc.set(item.voter.address, item);
              return acc;
            },
            new Map()
          )
        : new Map<string, VoteEvent>();

    return {
      id: proposalId,
      title: deserializedData.title,
      description: deserializedData.description,
      userVotes: votesForAddress,
    };
  }
  private async parseAddVoterVotableItem(
    deserializedData: AddVoterVotableItemSerializationData,
    args: ethers.Result,
    voteEventsForId: Record<string, VoteEvent[]>
  ): Promise<AddVoterVotableItem | undefined> {
    const votableItem = await this.parseVotableItem(
      deserializedData,
      args,
      voteEventsForId
    );
    if (!votableItem) {
      return undefined;
    }
    return {
      ...votableItem,
      newVoterAddress: deserializedData.newVoterAddress,
    };
  }
  private async serializeProposal(proposal: UIProposal | Proposal) {
    const serializationData: ProposalSerializationData = {
      type: "proposal",
      title: proposal.title,
      description: proposal.description,
      fileHash: proposal.file ? await fileToDigestHex(proposal.file) : "",
    };
    return JSON.stringify(serializationData);
  }
  private serializeVotableItem(
    item: UIVotableItem | UIAddVoterVotableItem,
    parentId: bigint,
    index: number
  ): string {
    let serializationData:
      | VotableItemSerializationData
      | AddVoterVotableItemSerializationData;
    if (IsUIAddVoterVotableItem(item)) {
      serializationData = {
        ...getNewVoterProposalDescription(item.newVoterAddress),
        type: "addVoterVoteItem",
        parentProposalId: parentId.toString(),
        newVoterAddress: item.newVoterAddress,
        index: 0,
      };
    } else {
      serializationData = {
        type: "voteItem",
        title: item.title,
        description: item.description,
        parentProposalId: parentId.toString(),
        index,
      };
    }
    return JSON.stringify(serializationData);
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
    const targetsCorrect =
      targets.length === 1 && targets[0] === this.tokenAddress;
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
    const correctCalldata = await this.getTransferTokenCalldata(addr);

    return callDatas[0] === correctCalldata;
  }
}
interface SerializationData {
  title: string;
  description: string;
  type: "proposal" | "voteItem" | "addVoterVoteItem";
}

interface ProposalSerializationData extends SerializationData {
  fileHash: string;
}
interface VotableItemSerializationData extends SerializationData {
  parentProposalId: string;
  index: number;
}
interface AddVoterVotableItemSerializationData
  extends VotableItemSerializationData {
  newVoterAddress: string;
}
