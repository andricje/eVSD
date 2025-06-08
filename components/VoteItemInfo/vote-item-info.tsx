import {
  countTotalVotes,
  convertAddressToName,
  getTranslatedVoteOptionWithCount,
  getVoteResult,
  isVotingComplete,
} from "@/lib/utils";
import { countVoteForOption, Proposal, VotableItem } from "@/types/proposal";
import { Badge } from "../ui/badge";
import { VoteBadge, VoteResultBadge } from "../badges";
import { STRINGS } from "@/constants/strings";

interface VoteItemInfoProps {
  voteItem: VotableItem;
  proposal?: Proposal;
}

/**
 * Displays summarized voting information for a given votable item, including counts for each vote option and the overall voting result.
 *
 * Renders badges showing the number of "for", "against", and "abstain" votes, along with a result badge that reflects the current voting outcome. Optionally incorporates proposal-specific details if a proposal is provided.
 *
 * @param voteItem - The item for which voting information is displayed.
 * @param proposal - Optional proposal associated with the vote item, used for displaying additional result context.
 */
export function VoteItemInfo({ voteItem, proposal }: VoteItemInfoProps) {
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
              status={getVoteResult(votesFor, votesAgainst, votesAbstain)}
              totalVotes={countTotalVotes(voteItem)}
              proposal={proposal}
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
            <span>{convertAddressToName(address)}</span>
            <VoteBadge vote={voteEvent.vote} />
          </div>
        ))}
      </div>
    </div>
  );
}
