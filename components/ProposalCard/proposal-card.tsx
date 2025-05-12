import Link from "next/link";
import { isQuorumReached, formatDate } from "@/lib/utils";
import { Proposal } from "@/types/proposal";
import { Progress } from "@radix-ui/react-progress";
import { Clock, User, Calendar, Vote } from "lucide-react";
import { StatusBadge } from "../badges";
import { Button } from "../ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";

interface ProposalCardProps {
  proposal: Proposal;
  isUrgent: boolean;
}
// ProposalCard Component - Proširena sa dodatnim informacijama
export function ProposalCard({ proposal, isUrgent }: ProposalCardProps) {
  const timeLeft = Math.max(
    0,
    proposal.closesAt ? proposal.closesAt.getTime() - new Date().getTime() : 0
  );
  const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

  const totalVotingPoints = proposal.itemsToVote.length;
  const pointsWithQuorum = proposal.itemsToVote.filter((votableItem) =>
    isQuorumReached(votableItem)
  ).length;
  const percentPointsWithQuorum = (pointsWithQuorum / totalVotingPoints) * 100;

  const authorName = proposal.author;

  return (
    <Card
      className={`bg-background border ${isUrgent ? "border-destructive/30" : "border-border/40"} rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden`}
    >
      <CardHeader className="pb-2.5 pt-4 px-5">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold text-foreground">
              {proposal.title}
            </CardTitle>
            <div className="flex items-center gap-1.5">
              <StatusBadge
                status={isUrgent ? "expiring" : proposal.status}
                expiresAt={proposal.closesAt}
                isUrgent={isUrgent}
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 px-2.5 py-1 rounded-md">
            <Clock className="h-4 w-4 text-amber-600" />
            <span className="font-medium">
              {hoursLeft}ч {minutesLeft}м
            </span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
          {proposal.description}
        </p>
      </CardHeader>
      <CardContent className="pt-2 pb-4 space-y-3 px-5">
        <div className="flex justify-between items-center text-sm border-t border-border/20 pt-2.5">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Аутор:</span>
            <span className="font-medium">{authorName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs">{formatDate(proposal.dateAdded)}</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">
              Број тачака са &quot;кворумом&quot;: {pointsWithQuorum}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="font-medium">
                {percentPointsWithQuorum.toFixed(0)}%
              </span>
            </div>
          </div>
          <Progress value={percentPointsWithQuorum} className="h-2" />
        </div>
        <Button
          size="sm"
          className="text-sm px-4 py-2 h-auto font-medium"
          asChild
        >
          <Link href={`/votes/${proposal.id}`}>
            <Vote className="h-4 w-4 mr-2" />
            Гласај
          </Link>
        </Button>
        <div className="pt-1.5 flex items-center justify-between"></div>
      </CardContent>
    </Card>
  );
}
