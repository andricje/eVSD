import { Badge } from "@/components/ui/badge";
import { STRINGS } from "@/constants/strings";
import { getRemainingTime, getTranslatedVoteOption } from "@/lib/utils";
import { ProposalState, VoteOption, VoteResult } from "@/types/proposal";
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
  switch (status) {
    case "open":
      return (
        <>
          <Badge className="bg-blue-500">{STRINGS.proposal.statusActive}</Badge>
          {expiresAt ? (
            <Badge className="bg-amber-500">
              <Timer className="h-3 w-3 mr-1" />
              {STRINGS.proposal.expiresAt} {getRemainingTime(expiresAt)}
            </Badge>
          ) : (
            <></>
          )}
        </>
      );
    case "closed":
      return (
        <Badge className="bg-red-500">{STRINGS.proposal.statusClosed}</Badge>
      );
    case "cancelled":
      return (
        <Badge className="bg-red-500">{STRINGS.proposal.statusCancelled}</Badge>
      );
  }
};

export const VoteResultBadge = ({ status }: { status: VoteResult }) => {
  switch (status) {
    case "passed":
      return (
        <Badge className="bg-green-500">{STRINGS.voting.results.passed}</Badge>
      );
    case "failed":
      return (
        <Badge className="bg-red-500">{STRINGS.voting.results.failed}</Badge>
      );
    case "no-quorum":
      return (
        <Badge className="bg-red-500">{STRINGS.voting.results.noQuorum}</Badge>
      );
  }
};
