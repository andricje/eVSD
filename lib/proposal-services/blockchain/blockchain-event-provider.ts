import { ethers } from "ethers";
import { convertAddressToName, governorVoteMap } from "../../utils";
import { VoteEvent } from "@/types/proposal";
import { EvsdGovernor } from "@/typechain-types";

export class BlockchainEventProvider {
  private readonly governor: EvsdGovernor;
  private readonly provider: ethers.Provider;

  constructor(governor: EvsdGovernor, provider: ethers.Provider) {
    this.governor = governor;
    this.provider = provider;
  }

  public async getAllVoteEvents() {
    // Filteriramo događaje za glasanje korisnika
    const filter = this.governor.filters.VoteCast();
    const events = await this.governor.queryFilter(filter, 0, "latest");

    // Mapiramo događaje u format za istoriju glasanja
    const votingHistory = events.map(async (event) => {
      const args = event.args;
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

  public async getAllCancelEvents() {
    const filter = this.governor.filters.ProposalCanceled();
    const events = await this.governor.queryFilter(filter, 0, "latest");

    const votingHistory = events.map(async (event) => {
      const args = event.args;
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
}
