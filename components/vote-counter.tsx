import { countTotalVotes, getVoteResult } from "../lib/utils";
import { VotableItem } from "../types/proposal";
import { Progress } from "./ui/progress";
import { CheckCircle2, CircleHelp, XCircle } from "lucide-react";

export interface VoteCounterProps {
  voteItem: VotableItem;
}

interface SingleOptionCounterProps {
  title: string;
  voteCount: number;
  votePercent: number;
  indicatorClassName: string;
}

function SingleOptionCounter({
  title,
  voteCount,
  votePercent,
  indicatorClassName,
}: SingleOptionCounterProps) {
  return (
    <div>
      <div className="flex justify-between mb-1 text-sm">
        <span>{title}</span>
        <span className="font-medium text-green-600">
          {voteCount} ({Math.round(votePercent)}%)
        </span>
      </div>
      <Progress
        value={votePercent}
        className="h-2 bg-slate-200"
        indicatorClassName={indicatorClassName}
      />
    </div>
  );
}

export function VoteCounter({ voteItem }: VoteCounterProps) {
  const totalVotes = Number(countTotalVotes(voteItem));
  const forVotesPercent = (Number(voteItem.votesFor) / totalVotes) * 100;
  const againstVotesPercent =
    (Number(voteItem.votesAgainst) / totalVotes) * 100;
  const abstainVotesPercent =
    (Number(voteItem.votesAbstain) / totalVotes) * 100;

  const result = getVoteResult(
    Number(voteItem.votesFor),
    Number(voteItem.votesAgainst),
    Number(voteItem.votesAbstain)
  );
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <div className="flex justify-between mb-2">
          <span className="font-medium">Укупно гласова:</span>
          <span>{totalVotes}</span>
        </div>
        <div className="space-y-2">
          <SingleOptionCounter
            title="За"
            voteCount={Number(voteItem.votesFor)}
            votePercent={forVotesPercent}
            indicatorClassName="bg-green-500"
          />
          <SingleOptionCounter
            title="Против"
            voteCount={Number(voteItem.votesAgainst)}
            votePercent={againstVotesPercent}
            indicatorClassName="bg-red-500"
          />
          <SingleOptionCounter
            title="Уздржан"
            voteCount={Number(voteItem.votesAbstain)}
            votePercent={abstainVotesPercent}
            indicatorClassName=""
          />
        </div>
      </div>

      {/* Rezultat - zeleni blok ako je predlog usvojen */}
      {result === "passed" && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3 flex items-start gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-green-800">Предлог усвојен</h3>
            <p className="text-sm text-green-700 mt-1">
              Предлог је усвојен већином гласова. Резултати су трајно забележени
              на блокчејну.
            </p>
          </div>
        </div>
      )}
      {/* Rezultat - crveni blok ako predlog nije usvojen */}
      {result === "failed" && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start gap-2">
          <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-800">Предлог одбијен</h3>
            <p className="text-sm text-red-700 mt-1">
              Предлог није добио довољан број гласова за усвајање. Резултати су
              трајно забележени на блокчејну.
            </p>
          </div>
        </div>
      )}

      {result === "returned" && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 flex items-start gap-2">
          <CircleHelp className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-800">
              Предлог враћен на поновно гласање
            </h3>
            <p className="text-sm text-red-700 mt-1">
              Предлог је враћен на поновно гласање.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
