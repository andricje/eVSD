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
} from "../../types/proposal";
import { ethers, EventLog } from "ethers";
import { ProposalFileService, fileToDigestHex } from "../file-upload";
import {
  convertAddressToName,
  governorVoteMap,
  getNewVoterProposalDescription,
  convertVoteOptionToGovernor,
  convertGovernorState,
} from "../utils";
import evsdGovernorArtifacts from "../../contracts/evsd-governor.json";
import evsdTokenArtifacts from "../../contracts/evsd-token.json";
import { ProposalService } from "./proposal-service";

export type onProposalsChangedUnsubscribe = () => void;

export class BlockchainProposalService implements ProposalService {
  private readonly governor: ethers.Contract;
  private readonly token: ethers.Contract;
  private readonly fileService: ProposalFileService;
  private readonly signer: ethers.Signer;
  private readonly provider: ethers.Provider;

  constructor(
    signer: ethers.Signer,
    fileService: ProposalFileService,
    provider: ethers.Provider
  ) {
    this.governor = new ethers.Contract(
      evsdGovernorArtifacts.address,
      evsdGovernorArtifacts.abi,
      signer
    );
    this.token = new ethers.Contract(
      evsdTokenArtifacts.address,
      evsdTokenArtifacts.abi,
      signer
    );
    this.fileService = fileService;
    this.signer = signer;
    this.provider = provider;
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


  private async parseProposal(deserializedData: SerializationData, args: ethers.Result) : Promise<Proposal | undefined>
  {
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

  private async parseVotableItem(deserializedData: VotableItemSerializationData, args: ethers.Result, voteEventsForId: Record<string, VoteEvent[]>) : Promise<VotableItem | undefined>
  {
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

  private async parseAddVoterVotableItem(deserializedData: AddVoterVotableItemSerializationData, args: ethers.Result, voteEventsForId: Record<string, VoteEvent[]>): Promise<AddVoterVotableItem | undefined>
  {
    const votableItem = await this.parseVotableItem(deserializedData, args, voteEventsForId);
    if(!votableItem)
    {
      return undefined;
    }
    return {
      ...votableItem,
      newVoterAddress: deserializedData.newVoterAddress
    };
  }

  async getProposals(): Promise<Proposal[]> {
    const proposalCreatedFilter = this.governor.filters.ProposalCreated();
    const events = await this.governor.queryFilter(
      proposalCreatedFilter,
      0,
      "latest"
    );

    const proposals: Proposal[] = [];
    const voteItemsForProposalId: Record<string, {item: VotableItem|AddVoterVotableItem, index: number}[]> = {};
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
        if(!proposal)
        {
          continue;
        }
        proposals.push(proposal);
      } else if(deserializedData.type === "voteItem"){
        const voteItemData = deserializedData as VotableItemSerializationData;
        const votableItem = await this.parseVotableItem(voteItemData,args,voteEventsForId);
        if(!votableItem)
        {
          continue;
        }
        // Add to the map
        if (!voteItemsForProposalId[voteItemData.parentProposalId]) {
          voteItemsForProposalId[voteItemData.parentProposalId] = [];
        }
        voteItemsForProposalId[voteItemData.parentProposalId].push({item:votableItem, index:voteItemData.index});
      }
      else if(deserializedData.type === "addVoterVoteItem")
      {
        // TODO: Verify args[3] is values or even better unpack the event in a better way
        this.isProposalAddVoter(args.calldatas, args.targets, args[3]);
        const voteItemData = deserializedData as AddVoterVotableItemSerializationData;
        const addVoterItem = await this.parseAddVoterVotableItem(voteItemData,args,voteEventsForId);
        if(!addVoterItem)
        {
          continue;
        }
        // Add to the map
        if (!voteItemsForProposalId[voteItemData.parentProposalId]) {
          voteItemsForProposalId[voteItemData.parentProposalId] = [];
        }
        voteItemsForProposalId[voteItemData.parentProposalId].push({item:addVoterItem, index:voteItemData.index});
      }
    }
    // Pair child VoteItems with Proposals
    for (const proposal of proposals) {
      const proposalId = proposal.id.toString();
      
      proposal.voteItems = []
      if(proposalId in voteItemsForProposalId)
      {
        // Ensure the vote items are ordered correctly
        const voteItemsCorrectOrder =  voteItemsForProposalId[proposalId].sort((lhs,rhs)=>{return lhs.index - rhs.index});
        proposal.voteItems = voteItemsCorrectOrder.map((x) => x.item);
      }

    }
    return proposals;
  }
  deserializeChainData(data: string): SerializationData {
    return JSON.parse(data) as SerializationData;
  }

  private async getAllVoteEvents() {
    // Filteriramo događaje za glasanje korisnika
    const filter = this.governor.filters.VoteCast();
    const events = await this.governor.queryFilter(filter, 0, "latest");

    // Mapiramo događaje u format za istoriju glasanja
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
        proposalId: args.proposalId.toString(),
        voteEvent,
      };
    });
    return (await Promise.all(votingHistory)).filter(
      (item) => item !== undefined
    );
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

  private serializeVotableItem(item: UIVotableItem, parentId: bigint, index: number): string {
    const serializationData: VotableItemSerializationData = {
      type: "voteItem",
      title: item.title,
      description: item.description,
      parentProposalId: parentId.toString(),
      index
    };
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
      targets.length === 1 && targets[0] === evsdTokenArtifacts.address;
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
    const tokenAddress = evsdTokenArtifacts.address;
    const newVoterAddress = item.newVoterAddress;
    const transferCalldata = this.getTransferTokenCalldata(newVoterAddress);

    const serializationData: AddVoterVotableItemSerializationData = {
      ...getNewVoterProposalDescription(newVoterAddress),
      type: "addVoterVoteItem",
      parentProposalId: parentProposalId.toString(),
      newVoterAddress
    };
    const descriptionSerialized = JSON.stringify(serializationData);

    const tx = await this.governor.propose(
      [tokenAddress],
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
    const serializedProposal = await this.serializeProposal(proposal);

    try {
      const proposalId = await this.createProposalDoNothing(serializedProposal);
      const uploadPromises = proposal.voteItems.map((voteItem, index) =>
        this.uploadVotableItem(voteItem, proposalId, index)
      );
      await Promise.all(uploadPromises);
      return proposalId;
    } catch (error) {
      console.error("Грешка при креирању предлога:", error);
      throw error;
    }
  }
  async voteForItem(item: VotableItem, vote: VoteOption) {
    const voteGovernor = convertVoteOptionToGovernor(vote);
    await this.governor.castVote(item.id, voteGovernor);
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
interface AddVoterVotableItemSerializationData extends VotableItemSerializationData {
  newVoterAddress: string;
}