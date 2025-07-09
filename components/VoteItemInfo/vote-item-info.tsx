import {
  countTotalVotes,
  getTranslatedVoteOptionWithCount,
  getVoteResult,
} from "@/lib/utils";
import {
  countVoteForOption,
  ProposalState,
  VotableItem,
} from "@/types/proposal";
import { Badge } from "../ui/badge";
import { VoteBadge, VoteResultBadge } from "../badges";
import { STRINGS } from "@/constants/strings";

interface VoteItemInfoProps {
  voteItem: VotableItem;
  proposalState: ProposalState;
  quorum: number;
}

export function VoteItemInfo({
  voteItem,
  proposalState,
  quorum,
}: VoteItemInfoProps) {
  const votesFor = countVoteForOption(voteItem, "for");
  const votesAgainst = countVoteForOption(voteItem, "against");
  const votesAbstain = countVoteForOption(voteItem, "abstain");
  return (
    <>
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 justify-between lg:gap-12">
        <div className="flex items-center gap-4">
          <div className="flex items-center">
            <Badge className="bg-green-500 flex-shrink-0 self-start h-fit">
              {getTranslatedVoteOptionWithCount("for", votesFor)}
            </Badge>
          </div>
          <div className="flex items-center">
            <Badge className="bg-red-500 flex-shrink-0 self-start h-fit">
              {getTranslatedVoteOptionWithCount("against", votesAgainst)}
            </Badge>
          </div>
          <div className="flex items-center">
            <Badge variant="outline" className="flex-shrink-0 self-start h-fit">
              {getTranslatedVoteOptionWithCount("abstain", votesAbstain)}
            </Badge>
          </div>
        </div>
        {/* <div>
        <p className="text-sm font-medium mb-1">{STRINGS.voting.quorum}</p>
        <div className="flex items-center">
          <span>
            {countTotalVotes(voteItem)}/{QUORUM}
          </span>
          {isQuorumReached(voteItem) && (
            <Badge className="bg-green-500 ml-2">
              {STRINGS.voting.quorumReached}
            </Badge>
          )}
        </div>
      </div> */}
        <div className="flex items-center sm:justify-end gap-2">
          <div className="flex sm:hidden">
            <p className="text-sm">{STRINGS.voting.result}: </p>
          </div>
          <div className="sm:min-w-[200px] flex sm:justify-end">
            <VoteResultBadge
              voteItem={voteItem}
              proposalState={proposalState}
              quorum={quorum}
            />
          </div>
        </div>
      </div>
    </>
  );
}
export function PerFacultyVotes({ voteItem }: { voteItem: VotableItem }) {
  return (
    <div className="mt-4 border rounded-md p-4">
      <h3 className="text-sm font-medium mb-2">
        {STRINGS.results.proposalInfo.perFacultyVotesTitle}
      </h3>
      <div className="grid gap-2 grid-cols-1 md:grid-cols-2">
        {[...voteItem.userVotes.entries()].map(([address, voteEvent]) => (
          <div
            key={address}
            className="flex justify-between py-1 border-b text-sm"
          >
            <span>{voteEvent.voter.name}</span>
            <VoteBadge vote={voteEvent.vote} />
          </div>
        ))}
      </div>
    </div>
  );
}
