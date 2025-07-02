import { User } from "@/types/proposal";
import { UserService } from "./user-service";
import { EvsdGovernor } from "@/typechain-types";
import { AddVoterVotableItemChainData } from "../proposal-services/blockchain/blockchain-proposal-parser";

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
  private readonly addressUserMap: Promise<Map<string, User>>;
  constructor(governor: EvsdGovernor) {
    this.governor = governor;
    this.addressUserMap = this.getAddressUserMap();
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
      if (state !== "Succeeded") {
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
  async getAllUsers(): Promise<User[]> {
    return [...(await this.addressUserMap).values()];
  }
  async getUserForAddress(address: string): Promise<User | undefined> {
    return (await this.addressUserMap).get(address);
  }
}
