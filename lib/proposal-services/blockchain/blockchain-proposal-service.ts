import { ethers } from "ethers";
import { BlockchainProposalReader } from "./blockchain-proposal-reader";
import { BlockchainProposalWriter } from "./blockchain-proposal-writer";
import {
  onProposalsChangedUnsubscribe,
  ProposalService,
} from "../proposal-service";
import { ProposalFileService } from "../../file-upload";
import {
  UserActivityEventVote,
  UserActivityEventProposal,
} from "@/components/user-activity/user-activity";
import {
  Proposal,
  UIProposal,
  VotableItem,
  VoteOption,
} from "@/types/proposal";
import { BlockchainUserActivityTracker } from "./blockchain-user-activity-tracker";
import { BlockchainEventProvider } from "./blockchain-event-provider";
import { EvsdGovernor, EvsdToken } from "@/typechain-types";

export class BlockchainProposalService implements ProposalService {
  private readonly reader: BlockchainProposalReader;
  private readonly writer: BlockchainProposalWriter;
  private readonly activityTracker: BlockchainUserActivityTracker;

  constructor(
    governor: EvsdGovernor,
    token: EvsdToken,
    signer: ethers.Signer,
    fileService: ProposalFileService,
    provider: ethers.Provider
  ) {
    governor = governor.connect(signer);
    token = token.connect(signer);
    this.reader = new BlockchainProposalReader(governor, token, provider);
    this.writer = new BlockchainProposalWriter(
      governor,
      token,
      signer,
      fileService,
      this.reader
    );
    this.activityTracker = new BlockchainUserActivityTracker(
      this.reader,
      new BlockchainEventProvider(governor, provider)
    );
  }
  public async getProposals(): Promise<Proposal[]> {
    return this.reader.getProposals();
  }
  public async getProposal(proposalId: bigint): Promise<Proposal> {
    return this.reader.getProposal(proposalId);
  }
  public onProposalsChanged(
    callback: (newProposals: Proposal[]) => void
  ): onProposalsChangedUnsubscribe {
    return this.reader.onProposalsChanged(callback);
  }
  public async uploadProposal(proposal: UIProposal): Promise<bigint> {
    return this.writer.uploadProposal(proposal);
  }
  public async voteForItem(item: VotableItem, vote: VoteOption): Promise<void> {
    return this.writer.voteForItem(item, vote);
  }
  public async cancelProposal(proposal: Proposal): Promise<boolean> {
    return this.writer.cancelProposal(proposal);
  }
  public async executeItem(proposal: Proposal, itemIndex: number) {
    return this.writer.executeItem(proposal, itemIndex);
  }
  public async getAllUserActivity(): Promise<
    (UserActivityEventVote | UserActivityEventProposal)[]
  > {
    return this.activityTracker.getAllUserActivity();
  }
}
