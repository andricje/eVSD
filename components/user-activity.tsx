"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { formatDate, getUserVotingHistory } from "@/lib/utils";
import { Proposal } from "@/types/proposal";
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

export function UserActivity() {
  const { proposals, proposalService } = useProposals();
  const { user } = useWallet();
  const { toast } = useToast();

  const userVotingHistory = getUserVotingHistory(proposals, user);
  const userProposals = proposals.filter(
    (proposal) => proposal.author === user
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

  const getVoteIconClass = (vote: string) => {
    if (vote === "for") {
      return <Check className="h-4 w-4 text-emerald-600" />;
    }
    if (vote === "against") {
      return <X className="h-4 w-4 text-rose-600" />;
    }
    return <AlertCircle className="h-4 w-4 text-gray-600" />;
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

          {userVotingHistory.length === 0 ? (
            <div className="rounded-xl bg-gray-50 p-8 text-center">
              <Check className="mx-auto h-10 w-10 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium">Još niste glasali</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Kada glasate na predlozima, ovde će se prikazati vaša istorija
                glasanja.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {userVotingHistory.map(({ event, item }, index) => (
                <div
                  key={index}
                  className="bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {getVoteIconClass(event.vote)}
                        </div>
                        <div>
                          <h3 className="font-medium">
                            {item.title ||
                              `Predlog #${item.id.toString().substring(0, 8)}...`}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                            <CalendarDays className="h-3 w-3" />
                            <span>{formatDate(event.date)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div
                        className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium
                        ${
                          event.vote === "for"
                            ? "bg-emerald-50 text-emerald-700"
                            : event.vote === "against"
                              ? "bg-rose-50 text-rose-700"
                              : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {event.vote === "for"
                          ? "Za"
                          : event.vote === "against"
                            ? "Protiv"
                            : "Uzdržan"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Aktivnosti na blokchainu</h2>

          <div className="relative">
            <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            <div className="space-y-4 pl-10 relative">
              {/* Kombinovanje podataka iz user proposals i voting history */}
              {[
                ...userProposals.map((p) => ({
                  type: "proposal_created",
                  date: p.dateAdded,
                  data: p,
                })),
                ...userVotingHistory.map((v) => ({
                  type: "vote_cast",
                  date: v.event.date,
                  data: v,
                })),
              ]
                .sort((a, b) => {
                  return b.date.getTime() - a.date.getTime(); // Od najnovijeg do najstarijeg
                })
                .map((activity, index) => (
                  <div key={index} className="relative">
                    <div className="absolute -left-10 mt-1">
                      <div
                        className={`h-6 w-6 rounded-full flex items-center justify-center
                      ${
                        activity.type === "proposal_created"
                          ? "bg-blue-50 border border-blue-200"
                          : activity.data.event.vote === "for"
                            ? "bg-emerald-50 border border-emerald-200"
                            : activity.data.event.vote === "against"
                              ? "bg-rose-50 border border-rose-200"
                              : "bg-gray-50 border border-gray-200"
                      }`}
                      >
                        {activity.type === "proposal_created" ? (
                          <Timer
                            className={`h-3 w-3 ${(activity.data as Proposal).status === "open" ? "text-blue-600" : "text-gray-600"}`}
                          />
                        ) : activity.data.event.vote === "for" ? (
                          <Check className="h-3 w-3 text-emerald-600" />
                        ) : activity.data.event.vote === "against" ? (
                          <X className="h-3 w-3 text-rose-600" />
                        ) : (
                          <AlertCircle className="h-3 w-3 text-gray-600" />
                        )}
                      </div>
                    </div>

                    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">
                            {activity.type === "proposal_created"
                              ? `Kreiran predlog: ${(activity.data as Proposal).title}`
                              : `Glasali ste ${activity.data.event.vote === "for" ? "za" : activity.data.event.vote === "against" ? "protiv" : "uzdržano"}: ${activity.data.item.title || "Predlog"}`}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {formatDate(activity.date)}
                          </div>
                        </div>
                        {activity.type === "proposal_created" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                            onClick={() =>
                              handleCancelProposal(activity.data as Proposal)
                            }
                          >
                            <X className="h-3.5 w-3.5 mr-1" />
                            Otkaži
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

              {userProposals.length === 0 && userVotingHistory.length === 0 && (
                <div className="rounded-xl bg-gray-50 p-8 text-center">
                  <Activity className="mx-auto h-10 w-10 text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium">Nema aktivnosti</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Vaše aktivnosti na blokchainu će se pojaviti ovde.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
