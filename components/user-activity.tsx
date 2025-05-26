"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { formatDate, getUserVotingHistory } from "@/lib/utils";
import { Proposal, User, VotableItem, VoteEvent } from "@/types/proposal";
import { useToast } from "@/hooks/use-toast";
import {
  CalendarDays,
  Check,
  Timer,
  X,
  Activity,
  AlertCircle,
} from "lucide-react";
import { useProposals } from "@/hooks/use-proposals";
import { useWallet } from "@/context/wallet-context";
import { Timeline } from "./user-activity/timeline";
import { useEffect, useState } from "react";
import { VotingHistory } from "./user-activity/voting-history";

export interface UserActivityEventVote {
   voteEvent: VoteEvent;
   proposal: Proposal;
   voteItem: VotableItem;
   date: Date;
}

export interface UserActivityEventProposal {
  type: "Create" | "Delete";
  proposal: Proposal;
  date: Date;
}

export function IsUserActivityVote(
  userActivityEvent: UserActivityEvent
): userActivityEvent is UserActivityEventVote {
  return (userActivityEvent as UserActivityEventVote).voteEvent !== undefined;
}

export type UserActivityEvent = UserActivityEventVote | UserActivityEventProposal;

export function UserActivity() {
  const { proposals, proposalService } = useProposals();
  const { user } = useWallet();
  const { toast } = useToast();

  const [activity, setActivity] = useState<(UserActivityEvent)[]>([]);
  useEffect(()=>{
    async function getUserActivity()
    {
      if(proposalService)
      {
        setActivity(await proposalService.getAllUserActivity());
      }
    }
    getUserActivity();
  },[proposalService])
  
  
  const userProposals = proposals.filter(
    (proposal) => proposal.author.address === user?.address
  );
  const activeProposals = proposals.filter((p) => p.status === "open");
  const completedProposals = proposals.filter((p) => p.status === "closed");

  // Handler za otkazivanje predloga
  const handleCancelProposal = async (proposal: Proposal) => {
    if (!proposalService) {
      toast({
        title: "Greška",
        description:
          "Nije moguće otkazati predlog. Niste povezani sa novčanikom.",
        variant: "destructive",
      });
      return;
    }

    try {
      const success = await proposalService.cancelProposal(proposal);

      if (success) {
        toast({
          title: "Uspešno otkazan predlog",
          description: `Predlog "${proposal.title}" je uspešno otkazan.`,
          variant: "default",
        });
      } else {
        throw new Error("Nije moguće otkazati predlog.");
      }
    } catch (error) {
      console.error("Greška pri otkazivanju predloga:", error);
      toast({
        title: "Greška",
        description: `Došlo je do greške prilikom otkazivanja predloga: ${
          error instanceof Error ? error.message : "Nepoznata greška"
        }`,
        variant: "destructive",
      });
    }
  };

  if (!proposalService) {
    return (
      <div className="rounded-xl bg-gray-50 p-8 text-center">
        <Activity className="mx-auto h-10 w-10 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium">Povežite se sa novčanikom</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Morate se povezati sa novčanikom da biste videli svoju aktivnost.
        </p>
      </div>
    );
  }

  // Stilovi za glasanje
  const getVoteStyleClass = (vote: string) => {
    if (vote === "for") {
      return "text-emerald-600";
    }
    if (vote === "against") {
      return "text-rose-600";
    }
    return "text-gray-600";
  };

  const getVoteBadgeStyle = (vote: string) => {
    if (vote === "for") {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
    if (vote === "against") {
      return "bg-rose-50 text-rose-700 border-rose-200";
    }
    return "bg-gray-50 text-gray-700 border-gray-200";
  };

  return (
    <Tabs defaultValue="glasanje">
      <TabsList className="w-full grid grid-cols-3 mb-6">
        <TabsTrigger value="glasanje" className="rounded-l-lg">
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            Istorija glasanja
          </span>
        </TabsTrigger>
        <TabsTrigger value="predlozi">
          <span className="flex items-center gap-2">
            <Timer className="w-4 h-4" />
            Moji predlozi
          </span>
        </TabsTrigger>
        <TabsTrigger value="aktivnosti" className="rounded-r-lg">
          <span className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Sve aktivnosti
          </span>
        </TabsTrigger>
      </TabsList>

      {/* Istorija glasanja */}
      <TabsContent value="glasanje">
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Istorija glasanja</h2>

          {activity.length === 0 ? (
            <div className="rounded-xl bg-gray-50 p-8 text-center">
              <Check className="mx-auto h-10 w-10 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium">Još niste glasali</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Kada glasate na predlozima, ovde će se prikazati vaša istorija
                glasanja.
              </p>
            </div>
          ) : (<VotingHistory activity={activity} />)}
        </div>
      </TabsContent>

      {/* Moji predlozi */}
      <TabsContent value="predlozi">
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Moji predlozi</h2>

          {userProposals.length === 0 ? (
            <div className="rounded-xl bg-gray-50 p-8 text-center">
              <Timer className="mx-auto h-10 w-10 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium">Nemate predloga</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Kada kreirate predlog za glasanje, pojaviće se ovde.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Aktivni predlozi */}
              {activeProposals.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-4">Aktivni predlozi</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {activeProposals.map((proposal) => (
                      <div
                        key={proposal.id.toString()}
                        className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="font-medium text-base">
                              {proposal.title}
                            </h4>
                            <div className="bg-blue-50 text-blue-700 text-xs font-medium rounded-full px-2.5 py-1">
                              Aktivno
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                            {proposal.description}
                          </p>

                          <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t">
                            <div>Dodato: {formatDate(proposal.dateAdded)}</div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                                onClick={() => handleCancelProposal(proposal)}
                              >
                                <X className="h-3.5 w-3.5 mr-1" />
                                Otkaži
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Završeni predlozi */}
              {completedProposals.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-4">
                    Završeni predlozi
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {completedProposals.map((proposal) => (
                      <div
                        key={proposal.id.toString()}
                        className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm"
                      >
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="font-medium text-base">
                              {proposal.title}
                            </h4>
                            <div className="bg-gray-100 text-gray-700 text-xs font-medium rounded-full px-2.5 py-1">
                              Završeno
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                            {proposal.description}
                          </p>

                          <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t">
                            <div>Završeno: {formatDate(proposal.closesAt)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </TabsContent>

      {/* Sve aktivnosti */}
      <TabsContent value="aktivnosti">
        <Timeline userActivity={activity} />
      </TabsContent>
    </Tabs>
  );
}
