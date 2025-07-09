import { Badge } from "@/components/ui/badge";
import { STRINGS } from "@/constants/strings";
import {
  countTotalVotes,
  getRemainingTime,
  getTranslatedVoteOption,
  getVoteResultForItem,
} from "@/lib/utils";
import { ProposalState, VotableItem, VoteOption } from "@/types/proposal";
import { CheckCircle2, MinusCircle, Timer, XCircle } from "lucide-react";

export const VoteBadge = ({ vote }: { vote: VoteOption }) => {
  const translatedVote = getTranslatedVoteOption(vote);
  switch (vote) {
    case "for":
      return <Badge className="bg-green-500">{translatedVote}</Badge>;
    case "against":
      return <Badge className="bg-red-500">{translatedVote}</Badge>;
    case "abstain":
      return <Badge variant="outline">{translatedVote}</Badge>;
  }
};

export const VoteIcon = ({ vote }: { vote: VoteOption }) => {
  if (vote === "for") {
    return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  } else if (vote === "against") {
    return <XCircle className="h-4 w-4 text-red-500" />;
  } else {
    return <MinusCircle className="h-4 w-4 text-muted-foreground" />;
  }
};

export const StatusBadge = ({
  status,
  expiresAt,
}: {
  status: ProposalState;
  expiresAt?: Date;
}) => {
  // If expiresAt date is provided and the voting time has expired override the status with 'closed'
  const remainingTime = expiresAt ? getRemainingTime(expiresAt) : null;
  if (expiresAt && !remainingTime) {
    status = "closed";
  }
  switch (status) {
    case "open":
      return (
        <>
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-500">
              {STRINGS.proposal.statusActive}
            </Badge>
            {expiresAt ? (
              <Badge className="bg-amber-500">
                <Timer className="h-3 w-3 mr-1" />
                {STRINGS.proposal.expiresAt} {remainingTime}
              </Badge>
            ) : (
              <></>
            )}
          </div>
        </>
      );
    case "closed":
      return (
        <Badge className="bg-gray-500">{STRINGS.proposal.statusClosed}</Badge>
      );
    case "cancelled":
      return (
        <Badge className="bg-red-500">{STRINGS.proposal.statusCancelled}</Badge>
      );
  }
};

export const VoteResultBadge = ({
  voteItem,
  proposalState,
  quorum,
}: {
  voteItem: VotableItem;
  proposalState: ProposalState;
  quorum: number;
}) => {
  const voteResult = getVoteResultForItem(voteItem, quorum);
  const totalVotes = countTotalVotes(voteItem);

  const renderBadge = (text: string, color: string) => (
    <Badge className={`bg-${color}-500`}>{text}</Badge>
  );

  if (proposalState === "open") {
    return renderBadge(STRINGS.proposal.statusActive, "blue");
  }

  if (proposalState === "cancelled") {
    return renderBadge(STRINGS.proposal.statusCancelled, "red");
  }

  if (proposalState === "closed") {
    switch (voteResult) {
      case "passed":
        return renderBadge(STRINGS.voting.results.passed, "green");
      case "failed":
        return renderBadge(STRINGS.voting.results.failed, "red");
      case "no-quorum":
        return renderBadge(
          `${STRINGS.voting.results.noQuorum} ${totalVotes}/${quorum}`,
          "red"
        );
    }
  }

  return null;
};
