import { User } from "@/types/proposal";
import { UserService } from "./user-service";
import { EvsdGovernor } from "@/typechain-types";
import { AddVoterVotableItemChainData } from "../proposal-services/blockchain/blockchain-proposal-parser";
import { STRINGS } from "../../constants/strings";
import { Signer } from "ethers";

type GovernorProposalState =
  | "Pending"
  | "Active"
  | "Canceled"
  | "Defeated"
  | "Succeeded"
  | "Queued"
  | "Expired"
  | "Executed";

export class BlockchainUserService implements UserService {
  private readonly governor: EvsdGovernor;
  private addressUserMap: Promise<Map<string, User>>;
  private readonly proposalExecutedListenerReady: Promise<EvsdGovernor> | null;
  private readonly initialUsers: User[];
  private readonly eventsEnabled: boolean;
  constructor(
    initialUsers: User[],
    governor: EvsdGovernor,
    signer: Signer | null
  ) {
    this.governor = signer ? governor.connect(signer) : governor;
    this.addressUserMap = this.getAddressUserMap();
    this.initialUsers = initialUsers;
    if (signer) {
      this.eventsEnabled = true;
      this.proposalExecutedListenerReady = this.governor.on(
        this.governor.filters.ProposalExecuted,
        () => {
          this.addressUserMap = this.getAddressUserMap();
        }
      );
    } else {
      this.eventsEnabled = false;
      this.proposalExecutedListenerReady = null;
    }
  }
  private readonly proposalStates: GovernorProposalState[] = [
    "Pending", // Proposal is created but not yet started
    "Active", // Proposal is active and voting is open
    "Canceled", // Proposal has been canceled
    "Defeated", // Proposal has been defeated (voting closed, not enough votes)
    "Succeeded", // Proposal succeeded (reached quorum and passed)
    "Queued", // Proposal is queued for execution
    "Expired",
    "Executed", // Proposal has been executed
  ];
  async getAddressUserMap() {
    const addressUserMap = new Map<string, User>();
    for (const user of this.initialUsers) {
      addressUserMap.set(user.address, user);
    }
    if (this.eventsEnabled) {
      await this.proposalExecutedListenerReady;
    }
    const proposalCreatedFilter = this.governor.filters.ProposalCreated();
    const events = await this.governor.queryFilter(
      proposalCreatedFilter,
      0,
      "latest"
    );
    for (const event of events) {
      const args = event.args;
      if (!args) {
        continue;
      }
      const deserializedData = JSON.parse(
        args.description
      ) as AddVoterVotableItemChainData;
      // Filter only add voter vote items
      if (deserializedData.type !== "addVoterVoteItem") {
        continue;
      }
      const stateIndex = Number(
        await this.governor.state(event.args.proposalId)
      );
      const state = this.proposalStates[stateIndex];
      // Filter only the votes that passed
      if (state !== "Succeeded" && state !== "Executed") {
        continue;
      }

      const user: User = {
        address: deserializedData.newVoterAddress,
        name: deserializedData.newVoterName,
      };
      addressUserMap.set(deserializedData.newVoterAddress, user);
    }
    return addressUserMap;
  }
  onProposalExecuted() {
    this.addressUserMap = this.getAddressUserMap();
  }
  async getAllUsers(): Promise<User[]> {
    return [...(await this.addressUserMap).values()];
  }
  async getUserForAddress(
    address: string,
    forceReload: boolean = false
  ): Promise<User> {
    if (forceReload || !this.eventsEnabled) {
      this.addressUserMap = this.getAddressUserMap();
    }
    const addressNameMap = await this.addressUserMap;
    const user = addressNameMap.get(address);
    return (
      user ?? {
        address,
        name: STRINGS.user.unknownUser,
      }
    );
  }
}
