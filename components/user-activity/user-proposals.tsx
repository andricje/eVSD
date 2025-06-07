import { STRINGS } from "@/constants/strings";
import { Proposal, User } from "@/types/proposal";
import { Timer, Eye } from "lucide-react";
import { CancelProposalButton } from "./cancel-proposal-button";
import { StatusBadge } from "../badges";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function ProposalDescriptionBody({ proposal }: { proposal: Proposal }) {
  switch (proposal.status) {
    case "open":
      return (
        <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t">
          <div>
            {STRINGS.userActivity.userProposals.addedAt}:{" "}
            {formatDate(proposal.dateAdded)}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
              asChild
            >
              <Link href={`/votes/${proposal.id}`}>
                <Eye className="h-3.5 w-3.5 mr-1" />
                Pogledaj
              </Link>
            </Button>
            <CancelProposalButton proposal={proposal} />
          </div>
        </div>
      );
    case "closed":
      return (
        <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t">
          <div>
            {STRINGS.userActivity.userProposals.closedAt}:{" "}
            {formatDate(proposal.dateAdded)}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
            asChild
          >
            <Link href={`/votes/${proposal.id}`}>
              <Eye className="h-3.5 w-3.5 mr-1" />
              Pogledaj
            </Link>
          </Button>
        </div>
      );
    case "cancelled":
      return (
        <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t">
          <div>{STRINGS.proposal.statusClosed}</div>
          <Button
            variant="outline"
            size="sm"
            className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
            asChild
          >
            <Link href={`/votes/${proposal.id}`}>
              <Eye className="h-3.5 w-3.5 mr-1" />
              Pogledaj
            </Link>
          </Button>
        </div>
      );
  }
}

function ProposalDescription({ proposal }: { proposal: Proposal }) {
  return (
    <div className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <h4 className="font-medium text-base">{proposal.title}</h4>
          <StatusBadge status={proposal.status} expiresAt={proposal.closesAt} />
        </div>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {proposal.description}
        </p>
        <ProposalDescriptionBody proposal={proposal} />
      </div>
    </div>
  );
}

export function UserProposals({
  proposals,
  user,
}: {
  proposals: Proposal[];
  user: User | null;
}) {
  const userProposals = proposals.filter(
    (proposal) => proposal.author.address === user?.address
  );
  const activeProposals = proposals.filter((p) => p.status === "open");
  const completedProposals = proposals.filter((p) => p.status === "closed");
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">
        {STRINGS.userActivity.userProposals.title}
      </h2>

      {userProposals.length === 0 ? (
        <div className="rounded-xl bg-gray-50 p-8 text-center">
          <Timer className="mx-auto h-10 w-10 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium">
            {STRINGS.userActivity.userProposals.noProposalsTitle}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {STRINGS.userActivity.userProposals.noProposalsDescription}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Aktivni predlozi */}
          {activeProposals.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-4">
                {STRINGS.userActivity.userProposals.activeProposals}
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {activeProposals.map((proposal) => (
                  <ProposalDescription
                    proposal={proposal}
                    key={proposal.id.toString()}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Završeni predlozi */}
          {completedProposals.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-4">
                {STRINGS.userActivity.userProposals.closedProposals}
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {completedProposals.map((proposal) => (
                  <ProposalDescription
                    proposal={proposal}
                    key={proposal.id.toString()}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
