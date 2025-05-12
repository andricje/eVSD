"use client";

import { useState, useEffect, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { StatusBadge, VoteIcon } from "@/components/badges";
import { Proposal } from "@/types/proposal";
import {
  getUserProposals,
  getUserVotingHistory,
  getDeployedContracts,
  cancelProposal,
  cancelProposalAlternative,
  cancelProposalDirect
} from "@/lib/blockchain-utils";
import { useBrowserSigner } from "@/hooks/use-browser-signer";
import { useToast } from "@/hooks/use-toast";
import { CalendarDays, Check, Timer, X, Activity, AlertCircle, Eye } from "lucide-react";
import Link from "next/link";

export function UserActivity() {
  const [votingHistory, setVotingHistory] = useState<any[]>([]);
  const [userProposals, setUserProposals] = useState<Proposal[]>([]);
  const [activeProposals, setActiveProposals] = useState<Proposal[]>([]);
  const [completedProposals, setCompletedProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { signer, signerAddress } = useBrowserSigner();
  const { toast } = useToast();

  // Funkcija za učitavanje podataka
  useEffect(() => {
    if (!signer || !signerAddress) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const { governor, token } = getDeployedContracts(signer);
        
        // Dohvatamo istoriju glasanja korisnika
        const history = await getUserVotingHistory(governor, signerAddress);
        
        // Za svaki glas dohvatamo dodatne informacije o predlogu
        const enhancedHistory = await Promise.all(
          history.map(async (vote) => {
            try {
              // Umesto filtriranja po proposalId (koji nije indeksirani parametar)
              // dohvatamo sve ProposalCreated događaje i ručno filtriramo
              const filter = governor.filters.ProposalCreated();
              const events = await governor.queryFilter(filter);
              
              // Ručno filtriramo događaje po proposalId
              const matchingEvents = events.filter(event => 
                event.args.proposalId.toString() === vote.proposalId.toString()
              );
              
              if (matchingEvents.length > 0) {
                const event = matchingEvents[0];
                const description = event.args.description;
                // Parsiramo opis koji je u JSON formatu
                const proposalData = JSON.parse(description);
                return {
                  ...vote,
                  proposalTitle: proposalData.title || "Bez naslova",
                  proposalDescription: proposalData.description || "Bez opisa",
                  timestamp: new Date(vote.timestamp * 1000)
                };
              }
              return vote;
            } catch (error) {
              console.error("Greška pri dohvatanju detalja predloga:", error);
              return vote;
            }
          })
        );
        
        // Sortiramo hronološki - od najnovijih ka najstarijim
        const sortedHistory = enhancedHistory.sort((a, b) => {
          if (a.timestamp instanceof Date && b.timestamp instanceof Date) {
            return b.timestamp.getTime() - a.timestamp.getTime();
          }
          return 0;
        });
        
        setVotingHistory(sortedHistory);
        
        // Dohvatamo predloge koje je korisnik kreirao
        const proposals = await getUserProposals(governor, token, signerAddress, signer);
        setUserProposals(proposals);
        
        // Razdvajamo na aktivne i završene predloge
        setActiveProposals(proposals.filter(p => p.status === "open"));
        setCompletedProposals(proposals.filter(p => p.status === "closed"));
      } catch (error) {
        console.error("Greška pri dohvatanju korisničke aktivnosti:", error);
        toast({
          title: "Greška",
          description: "Došlo je do greške prilikom učitavanja vaše aktivnosti.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [signer, signerAddress, toast]);

  // Handler za otkazivanje predloga
  const handleCancelProposal = async (proposal: Proposal) => {
    if (!signer) {
      toast({
        title: "Greška",
        description: "Nije moguće otkazati predlog. Niste povezani sa novčanikom.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { governor } = getDeployedContracts(signer);
      
      // Pokušaj sa sve tri metode redom dok neka ne uspe
      console.log("Pokušavam otkazivanje predloga - metoda 1");
      let success = await cancelProposal(signer, governor, proposal.id);
      
      if (!success) {
        console.log("Metoda 1 nije uspela, pokušavam alternativnu metodu");
        success = await cancelProposalAlternative(signer, governor, proposal.id);
      }
      
      if (!success) {
        console.log("Alternativna metoda nije uspela, pokušavam direktnu metodu");
        success = await cancelProposalDirect(signer, governor, proposal.id);
      }
      
      if (success) {
        toast({
          title: "Uspešno otkazan predlog",
          description: `Predlog "${proposal.title}" je uspešno otkazan.`,
          variant: "default",
        });
        
        // Ažuriramo listu predloga
        const updatedProposal: Proposal = { 
          ...proposal, 
          status: "closed" as const, 
          canBeCanceled: false 
        };
        
        // Ažuriranje lista
        setUserProposals(prev => 
          prev.map(p => p.id === proposal.id ? updatedProposal : p)
        );
        setActiveProposals(prev => prev.filter(p => p.id !== proposal.id));
        setCompletedProposals(prev => [...prev, updatedProposal]);
        
      } else {
        throw new Error("Nije moguće otkazati predlog nakon tri pokušaja.");
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-black"></div>
          <p className="text-muted-foreground text-sm">Učitavanje aktivnosti...</p>
        </div>
      </div>
    );
  }

  if (!signer) {
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
    if (vote === "for") return "text-emerald-600";
    if (vote === "against") return "text-rose-600";
    return "text-gray-600";
  };
  
  const getVoteIconClass = (vote: string) => {
    if (vote === "for") return <Check className="h-4 w-4 text-emerald-600" />;
    if (vote === "against") return <X className="h-4 w-4 text-rose-600" />;
    return <AlertCircle className="h-4 w-4 text-gray-600" />;
  };

  const getVoteBadgeStyle = (vote: string) => {
    if (vote === "for") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (vote === "against") return "bg-rose-50 text-rose-700 border-rose-200";
    return "bg-gray-50 text-gray-700 border-gray-200";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Moje aktivnosti</h2>
          <p className="text-muted-foreground">
            Pregled vaših glasova, predloga i drugih aktivnosti
          </p>
        </div>
      </div>

      <Tabs defaultValue="glasanje" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="glasanje" className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            Istorija glasanja
          </TabsTrigger>
          <TabsTrigger value="predlozi" className="flex items-center gap-2">
            <Timer className="w-4 h-4" />
            Moji predlozi
          </TabsTrigger>
          <TabsTrigger value="aktivnosti" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Sve aktivnosti
          </TabsTrigger>
        </TabsList>
        
        {/* Istorija glasanja */}
        <TabsContent value="glasanje">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Istorija glasanja</h2>
            
            {votingHistory.length === 0 ? (
              <div className="rounded-xl bg-gray-50 p-8 text-center">
                <Check className="mx-auto h-10 w-10 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium">Još niste glasali</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Kada glasate na predlozima, ovde će se prikazati vaša istorija glasanja.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {votingHistory.map((vote, index) => (
                  <div
                    key={index}
                    className="bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            {getVoteIconClass(vote.vote)}
                          </div>
                          <div>
                            <h3 className="font-medium">
                              {vote.proposalTitle || `Predlog #${vote.proposalId.substring(0, 8)}...`}
                            </h3>
                            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                              <CalendarDays className="h-3 w-3" />
                              <span>
                                {vote.timestamp instanceof Date
                                  ? formatDate(vote.timestamp)
                                  : "Nepoznat datum"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium
                          ${vote.vote === 'for' ? 'bg-emerald-50 text-emerald-700' : 
                            vote.vote === 'against' ? 'bg-rose-50 text-rose-700' : 
                            'bg-gray-100 text-gray-700'}`}
                        >
                          {vote.vote === 'for' ? 'Za' : 
                           vote.vote === 'against' ? 'Protiv' : 
                           'Uzdržan'}
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="ml-2"
                          asChild
                        >
                          <Link href={`/votes/${vote.proposalId}`}>
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            Vidi predlog
                          </Link>
                        </Button>
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
                              <h4 className="font-medium text-base">{proposal.title}</h4>
                              <div className="bg-blue-50 text-blue-700 text-xs font-medium rounded-full px-2.5 py-1">
                                Aktivno
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                              {proposal.description}
                            </p>
                            
                            <div className="grid grid-cols-3 gap-2 text-xs mb-4">
                              <div className="bg-emerald-50 rounded-lg p-2 text-center">
                                <div className="text-emerald-700 font-medium text-sm">{proposal.votesFor}</div>
                                <div className="text-gray-500 mt-1">Za</div>
                              </div>
                              <div className="bg-rose-50 rounded-lg p-2 text-center">
                                <div className="text-rose-700 font-medium text-sm">{proposal.votesAgainst}</div>
                                <div className="text-gray-500 mt-1">Protiv</div>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-2 text-center">
                                <div className="text-gray-700 font-medium text-sm">{proposal.votesAbstain}</div>
                                <div className="text-gray-500 mt-1">Uzdržano</div>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t">
                              <div>Dodato: {formatDate(proposal.dateAdded)}</div>
                              <div className="flex gap-2">
                                {proposal.canBeCanceled && (
                                  <Button 
                                    variant="outline"
                                    size="sm"
                                    className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                                    onClick={() => handleCancelProposal(proposal)}
                                  >
                                    <X className="h-3.5 w-3.5 mr-1" />
                                    Otkaži
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  asChild
                                >
                                  <Link href={`/votes/${proposal.id.toString()}`}>
                                    <Eye className="h-3.5 w-3.5 mr-1" />
                                    Detalji
                                  </Link>
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
                    <h3 className="text-lg font-medium mb-4">Završeni predlozi</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {completedProposals.map((proposal) => (
                        <div 
                          key={proposal.id.toString()}
                          className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm"
                        >
                          <div className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <h4 className="font-medium text-base">{proposal.title}</h4>
                              <div className="bg-gray-100 text-gray-700 text-xs font-medium rounded-full px-2.5 py-1">
                                Završeno
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                              {proposal.description}
                            </p>
                            
                            <div className="grid grid-cols-3 gap-2 text-xs mb-4">
                              <div className="bg-white border rounded-lg p-2 text-center">
                                <div className="text-emerald-700 font-medium text-sm">{proposal.votesFor}</div>
                                <div className="text-gray-500 mt-1">Za</div>
                              </div>
                              <div className="bg-white border rounded-lg p-2 text-center">
                                <div className="text-rose-700 font-medium text-sm">{proposal.votesAgainst}</div>
                                <div className="text-gray-500 mt-1">Protiv</div>
                              </div>
                              <div className="bg-white border rounded-lg p-2 text-center">
                                <div className="text-gray-700 font-medium text-sm">{proposal.votesAbstain}</div>
                                <div className="text-gray-500 mt-1">Uzdržano</div>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t">
                              <div>Završeno: {formatDate(proposal.closesAt)}</div>
                              <div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  asChild
                                >
                                  <Link href={`/votes/${proposal.id.toString()}`}>
                                    <Eye className="h-3.5 w-3.5 mr-1" />
                                    Detalji
                                  </Link>
                                </Button>
                              </div>
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
                {[...userProposals.map(p => ({ 
                  type: "proposal_created", 
                  timestamp: p.dateAdded, 
                  data: p 
                })),
                ...votingHistory.map(v => ({ 
                  type: "vote_cast", 
                  timestamp: v.timestamp, 
                  data: v 
                }))].sort((a, b) => {
                  const dateA = a.timestamp instanceof Date ? a.timestamp.getTime() : 0;
                  const dateB = b.timestamp instanceof Date ? b.timestamp.getTime() : 0;
                  return dateB - dateA; // Od najnovijeg do najstarijeg
                }).map((activity, index) => (
                  <div key={index} className="relative">
                    <div className="absolute -left-10 mt-1">
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center
                        ${activity.type === "proposal_created" 
                          ? "bg-blue-50 border border-blue-200" 
                          : (activity.data.vote === "for" 
                            ? "bg-emerald-50 border border-emerald-200"
                            : activity.data.vote === "against" 
                              ? "bg-rose-50 border border-rose-200"
                              : "bg-gray-50 border border-gray-200")
                        }`}
                      >
                        {activity.type === "proposal_created" ? (
                          <Timer className={`h-3 w-3 ${activity.data.status === "open" ? "text-blue-600" : "text-gray-600"}`} />
                        ) : (
                          activity.data.vote === "for" ? (
                            <Check className="h-3 w-3 text-emerald-600" />
                          ) : activity.data.vote === "against" ? (
                            <X className="h-3 w-3 text-rose-600" />
                          ) : (
                            <AlertCircle className="h-3 w-3 text-gray-600" />
                          )
                        )}
                      </div>
                    </div>
                    
                    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">
                            {activity.type === "proposal_created" 
                              ? `Kreiran predlog: ${activity.data.title}` 
                              : `Glasali ste ${activity.data.vote === 'for' ? 'za' : activity.data.vote === 'against' ? 'protiv' : 'uzdržano'}: ${activity.data.proposalTitle || 'Predlog'}`}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {activity.timestamp instanceof Date ? formatDate(activity.timestamp) : "Nepoznat datum"}
                          </div>
                        </div>
                        
                      </div>
                    </div>
                  </div>
                ))}
                
                {userProposals.length === 0 && votingHistory.length === 0 && (
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
    </div>
  );
} 