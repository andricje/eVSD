import {
  countTotalVotes,
  QUORUM,
  isQuorumReached,
  convertAddressToName,
  getTranslatedVoteOption,
} from "@/lib/utils";
import { VotableItem } from "@/types/proposal";
import { Badge } from "../ui/badge";
import { VoteBadge } from "../badges";

interface VoteItemInfoProps {
  voteItem: VotableItem;
}
export function VoteItemInfo({ voteItem }: VoteItemInfoProps) {
  return (
    <>
      <div className="flex items-center gap-4">
        <div className="flex items-center">
          <Badge className="bg-green-500">{getTranslatedVoteOption("for")}</Badge>
          <span className="ml-1">{voteItem.votesFor}</span>
        </div>
        <div className="flex items-center">
          <Badge className="bg-red-500">{getTranslatedVoteOption("against")}</Badge>
          <span className="ml-1">{voteItem.votesAgainst}</span>
        </div>
        <div className="flex items-center">
          <Badge variant="outline">{getTranslatedVoteOption("abstain")}</Badge>
          <span className="ml-1">{voteItem.votesAbstain}</span>
        </div>
      </div>
      <div>
        <p className="text-sm font-medium mb-1">Кворум</p>
        <div className="flex items-center">
          <span>
            {countTotalVotes(voteItem)}/{QUORUM}
          </span>
          {isQuorumReached(voteItem) && (
            <Badge className="bg-green-500 ml-2">Достигнут</Badge>
          )}
        </div>
      </div>
    </>
  );
}
export function PerFacultyVotes({ voteItem }: { voteItem: VotableItem }) {
  return (
    <div className="mt-4 border rounded-md p-4">
      <h3 className="text-sm font-medium mb-2">
        Детаљи гласања по факултетима
      </h3>
      <div className="grid gap-2 grid-cols-1 md:grid-cols-2">
        {Object.entries(voteItem.userVotes).map(([address, voteEvent]) => (
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
