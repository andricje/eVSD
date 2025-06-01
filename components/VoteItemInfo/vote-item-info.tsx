import {
  countTotalVotes,
  QUORUM,
  isQuorumReached,
  convertAddressToName,
  getTranslatedVoteOption,
  getTranslatedVoteOptionWithCount,
  getVoteResult,
} from "@/lib/utils";
import { countVoteForOption, VotableItem } from "@/types/proposal";
import { Badge } from "../ui/badge";
import { VoteBadge, VoteResultBadge } from "../badges";
import { STRINGS } from "@/constants/strings";

interface VoteItemInfoProps {
  voteItem: VotableItem;
}
export function VoteItemInfo({ voteItem }: VoteItemInfoProps) {
  const votesFor = countVoteForOption(voteItem, "for");
  const votesAgainst = countVoteForOption(voteItem, "against");
  const votesAbstain = countVoteForOption(voteItem, "abstain");
  return (
    <>
      <div className="flex items-center gap-4">
        <div className="flex items-center">
          <Badge className="bg-green-500">
            {getTranslatedVoteOptionWithCount("for", votesFor)}
          </Badge>
        </div>
        <div className="flex items-center">
          <Badge className="bg-red-500">
            {getTranslatedVoteOptionWithCount("against", votesAgainst)}
          </Badge>
        </div>
        <div className="flex items-center">
          <Badge variant="outline">
            {getTranslatedVoteOptionWithCount("abstain", votesAbstain)}
          </Badge>
        </div>
      </div>
      <div>
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
      </div>
      <div>
        <p className="text-sm font-medium mb-1">{STRINGS.voting.result}</p>
        <VoteResultBadge
          status={getVoteResult(votesFor, votesAgainst, votesAbstain)}
        />
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
            <span>{convertAddressToName(address)}</span>
            <VoteBadge vote={voteEvent.vote} />
          </div>
        ))}
      </div>
    </div>
  );
}
