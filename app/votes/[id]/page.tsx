"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  ThumbsDown,
  ThumbsUp,
  User,
  UserCheck,
  Vote,
  X, 
  AlertTriangle,
  Timer,
  CheckCircle2,
  XCircle,
  Layers,
  Info,
  Lock
} from "lucide-react";

import { useProposals } from "@/hooks/use-proposals";
import { useBrowserSigner } from "@/hooks/use-browser-signer";
import { Proposal, VoteOption } from "@/types/proposal";
import {
  formatDate,
  formatDateString,
  getRemainingTime,
  hasVotingTimeExpired,
  isVotingComplete,
  convertAddressToName,
  countTotalVotes,
  QUORUM
} from "@/lib/utils";
import { castVote, getDeployedContracts } from "@/lib/blockchain-utils";

// Funkcija za glasanje na predlog
async function castVoteOnProposal(
  signer: any,
  proposalId: bigint,
  vote: VoteOption,
  subItemId?: string | null
): Promise<boolean> {
  try {
    if (!signer) return false;
    
    const { governor } = getDeployedContracts(signer);
    
    // Konvertujemo vote opciju u broj za pametni ugovor
    let voteValue = 0; // Abstain za protiv (protiv=0, za=1, uzdržan=2)
    if (vote === "for") voteValue = 1;
    if (vote === "abstain") voteValue = 2;

    // Za sada nema posebne implementacije za glasanje na podtačke,
    // pa samo glasamo na glavni predlog
    await castVote(signer, governor, proposalId, voteValue);
    
    return true;
  } catch (error) {
    console.error("Greška pri glasanju:", error);
    return false;
  }
}

// Funkcija za završetak plenuma
async function endProposalVoting(
  signer: any,
  proposalId: bigint
): Promise<boolean> {
  try {
    if (!signer) return false;
    
    const { governor } = getDeployedContracts(signer);
    
    // Implementacija zavisi od smart kontrakta
    // Ovo je primer poziva funkcije za završetak glasanja
    // await governor.closeVoting(proposalId);
    
    console.log("Simuliramo zatvaranje glasanja za predlog:", proposalId.toString());
    
    // Trenutno samo simuliramo uspeh
    return true;
  } catch (error) {
    console.error("Greška pri zatvaranju glasanja:", error);
    return false;
  }
}

// VoteConfirm komponenta
const VoteConfirm: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void;
  vote: string;
  isLoading: boolean;
  subItemTitle?: string;
}> = ({ isOpen, onClose, onConfirm, vote, isLoading, subItemTitle }) => {
  if (!isOpen) return null;

  let voteText = "Uzdržan";
  if (vote === "for") voteText = "ZA";
  if (vote === "against") voteText = "PROTIV";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>Potvrda glasanja</CardTitle>
          <CardDescription>
            {subItemTitle ? 
              `Potvrđujete glas za podtačku: ${subItemTitle}` : 
              "Potvrđujete vaš glas na ovom predlogu"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center p-4">
            {vote === "for" && <ThumbsUp className="h-16 w-16 mx-auto text-green-500 mb-4" />}
            {vote === "against" && <ThumbsDown className="h-16 w-16 mx-auto text-red-500 mb-4" />}
            {vote === "abstain" && <UserCheck className="h-16 w-16 mx-auto text-amber-500 mb-4" />}
            <p className="text-lg font-medium">Glasaćete {voteText}</p>
            <p className="text-muted-foreground mt-2">
              Nakon potvrde vaš glas je trajno zabeležen i ne može se promeniti.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>Otkaži</Button>
          <Button onClick={onConfirm} disabled={isLoading}>
            {isLoading ? "Slanje..." : "Potvrdi glas"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

// EndVotingConfirm komponenta
const EndVotingConfirm: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void;
  isLoading: boolean;
}> = ({ isOpen, onClose, onConfirm, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>Završetak plenuma</CardTitle>
          <CardDescription>
            Potvrđujete da želite da završite plenum za ovaj predlog?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center p-4">
            <Lock className="h-16 w-16 mx-auto text-blue-500 mb-4" />
            <p className="text-lg font-medium">Zatvaranje glasanja</p>
            <p className="text-muted-foreground mt-2">
              Nakon potvrde glasanje će biti zatvoreno i rezultati će biti konačni. Ova akcija ne može biti poništena.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>Otkaži</Button>
          <Button onClick={onConfirm} disabled={isLoading} variant="destructive">
            {isLoading ? "Slanje..." : "Završi plenum"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

// VoteButton komponenta
const VoteButton: React.FC<{
  type: "for" | "against" | "abstain";
  disabled?: boolean;
  active?: boolean;
  onClick: () => void;
}> = ({ type, disabled = false, active = false, onClick }) => {
  let icon = <UserCheck className="h-5 w-5" />;
  let text = "Uzdržan";
  let colorClass = "border-amber-200 text-amber-700";
  let activeClass = "bg-amber-100";
  
  if (type === "for") {
    icon = <ThumbsUp className="h-5 w-5" />;
    text = "Za";
    colorClass = "border-green-200 text-green-700";
    activeClass = "bg-green-100";
  } else if (type === "against") {
    icon = <ThumbsDown className="h-5 w-5" />;
    text = "Protiv";
    colorClass = "border-red-200 text-red-700";
    activeClass = "bg-red-100";
  }

  return (
    <Button 
      variant="outline" 
      size="lg"
      disabled={disabled}
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 border py-6 
        ${active ? activeClass : 'bg-transparent'} 
        ${disabled ? 'opacity-50' : colorClass}`}
    >
      {icon}
      <span className="font-medium">{text}</span>
    </Button>
  );
};

// VoteResultBar komponenta
const VoteResultBar: React.FC<{
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
}> = ({ votesFor, votesAgainst, votesAbstain }) => {
  const totalVotes = votesFor + votesAgainst + votesAbstain;
  const forPercent = totalVotes > 0 ? (votesFor / totalVotes) * 100 : 0;
  const againstPercent = totalVotes > 0 ? (votesAgainst / totalVotes) * 100 : 0;
  const abstainPercent = totalVotes > 0 ? (votesAbstain / totalVotes) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="bg-green-500 transition-all"
          style={{ width: `${forPercent}%` }}
        />
        <div
          className="bg-red-500 transition-all"
          style={{ width: `${againstPercent}%` }}
        />
        <div
          className="bg-amber-500 transition-all"
          style={{ width: `${abstainPercent}%` }}
        />
      </div>
      <div className="flex justify-between text-xs">
        <div className="flex items-center">
          <span className="h-2 w-2 rounded-full bg-green-500 mr-1"></span>
          <span>Za: {votesFor} ({forPercent.toFixed(1)}%)</span>
        </div>
        <div className="flex items-center">
          <span className="h-2 w-2 rounded-full bg-red-500 mr-1"></span>
          <span>Protiv: {votesAgainst} ({againstPercent.toFixed(1)}%)</span>
        </div>
        <div className="flex items-center">
          <span className="h-2 w-2 rounded-full bg-amber-500 mr-1"></span>
          <span>Uzdržani: {votesAbstain} ({abstainPercent.toFixed(1)}%)</span>
        </div>
      </div>
    </div>
  );
};

// StatusBadge komponenta
const StatusBadge = ({ 
  status, 
  expiresAt,
  quorumReached
}: { 
  status: string; 
  expiresAt?: Date;
  quorumReached: boolean;
}) => {
  if (status === "closed") {
    return <Badge variant="outline" className="bg-gray-500/10 text-gray-700 border-gray-200">Glasanje zatvoreno</Badge>;
  } else if (expiresAt && hasVotingTimeExpired({ closesAt: expiresAt } as Proposal)) {
    return <Badge variant="outline" className="bg-gray-500/10 text-gray-700 border-gray-200">Glasanje isteklo</Badge>;
  } else if (!quorumReached) {
    return (
      <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-200">
        <Info className="h-3 w-3 mr-1" />
        Čeka se kvorum
      </Badge>
    );
  } else if (expiresAt) {
    return (
      <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-200">
        <Timer className="h-3 w-3 mr-1" />
        {getRemainingTime(expiresAt)}
      </Badge>
    );
  } else {
    return <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-200">Glasanje otvoreno</Badge>;
  }
};

// YourVoteBadge komponenta
const YourVoteBadge = ({ vote }: { vote: string }) => {
  if (vote === "for") {
    return (
      <Badge className="bg-green-500/10 text-green-700 border-green-200">
        <ThumbsUp className="h-3 w-3 mr-1" /> Glasali ste ZA
      </Badge>
    );
  } else if (vote === "against") {
    return (
      <Badge className="bg-red-500/10 text-red-700 border-red-200">
        <ThumbsDown className="h-3 w-3 mr-1" /> Glasali ste PROTIV
      </Badge>
    );
  } else if (vote === "abstain") {
    return (
      <Badge className="bg-amber-500/10 text-amber-700 border-amber-200">
        <UserCheck className="h-3 w-3 mr-1" /> Glasali ste UZDRŽANO
      </Badge>
    );
  }
  return null;
};

// AuthorBadge komponenta - prikazuje da li je korisnik autor predloga
const AuthorBadge = ({ isAuthor }: { isAuthor: boolean }) => {
  if (!isAuthor) return null;
  
  return (
    <Badge className="bg-blue-500/10 text-blue-700 border-blue-200">
      <User className="h-3 w-3 mr-1" /> Vaš predlog
    </Badge>
  );
};

// SubItemVoting komponenta za glasanje na podtačkama
const SubItemVoting: React.FC<{
  subItem: any;  
  isVotingEnabled: boolean;
  onVote: (id: string, vote: string, title: string) => void;
}> = ({ subItem, isVotingEnabled, onVote }) => {
  return (
    <Card className="border-border/40 mb-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{subItem.title}</CardTitle>
          {subItem.yourVote !== "didntVote" && (
            <YourVoteBadge vote={subItem.yourVote} />
          )}
        </div>
        <CardDescription className="whitespace-pre-wrap">{subItem.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <VoteResultBar 
          votesFor={subItem.votesFor || 0} 
          votesAgainst={subItem.votesAgainst || 0} 
          votesAbstain={subItem.votesAbstain || 0} 
        />
      </CardContent>
      {isVotingEnabled && subItem.yourVote === "didntVote" && (
        <CardFooter className="flex gap-2 pt-0">
          <VoteButton 
            type="for" 
            onClick={() => onVote(subItem.id, "for", subItem.title)} 
          />
          <VoteButton 
            type="against" 
            onClick={() => onVote(subItem.id, "against", subItem.title)} 
          />
          <VoteButton 
            type="abstain" 
            onClick={() => onVote(subItem.id, "abstain", subItem.title)} 
          />
        </CardFooter>
      )}
    </Card>
  );
};

// Glavna komponenta za prikaz detalja predloga i glasanje
export default function ProposalDetails() {
  const params = useParams();
  const router = useRouter();
  const { signer, signerAddress } = useBrowserSigner();
  const { proposals } = useProposals();
  
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Stanja za glasanje
  const [selectedVote, setSelectedVote] = useState<string | null>(null);
  const [isVoteDialogOpen, setIsVoteDialogOpen] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [selectedSubItemId, setSelectedSubItemId] = useState<string | null>(null);
  const [selectedSubItemTitle, setSelectedSubItemTitle] = useState<string>("");
  const [isAuthor, setIsAuthor] = useState(false);
  
  // Stanje za završetak plenuma
  const [isEndVotingDialogOpen, setIsEndVotingDialogOpen] = useState(false);
  const [isEndingVoting, setIsEndingVoting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false); // Treba implementirati proveru admin prava

  // Funkcija za dohvatanje predloga po ID-u
  const getProposal = (id: bigint) => {
    return proposals.find(p => p.id === id);
  };

  // Funkcija za osvežavanje predloga
  const refreshProposals = () => {
    if (params.id && proposals.length > 0) {
      try {
        const proposalId = BigInt(params.id.toString());
        const updatedProposal = proposals.find(p => p.id === proposalId);
        if (updatedProposal) {
          setProposal(updatedProposal);
        }
      } catch (e) {
        console.error("Greška pri osvežavanju predloga:", e);
      }
    }
  };

  // Učitavamo predlog na osnovu ID-a iz URL-a
  useEffect(() => {
    if (params.id && proposals.length > 0) {
      try {
        const proposalId = BigInt(params.id.toString());
        const fetchedProposal = proposals.find(p => p.id === proposalId);
        
        if (fetchedProposal) {
          setProposal(fetchedProposal);
          
          // Proveravamo da li je trenutni korisnik autor predloga
          if (signerAddress) {
            const isCurrentUserAuthor = fetchedProposal.author.toLowerCase() === signerAddress.toLowerCase();
            setIsAuthor(isCurrentUserAuthor);
            
            // Privremena implementacija admin provere - u pravom sistemu trebalo bi proveriti iz kontrakta
            // Da li korisnik ima admin ulogu
            setIsAdmin(true); // Samo za demo, u pravom sistemu trebalo bi proveriti admin prava
          }
        } else {
          setError("Predlog nije pronađen.");
        }
      } catch (e) {
        console.error("Greška pri učitavanju predloga:", e);
        setError("Greška pri učitavanju predloga.");
      } finally {
        setIsLoading(false);
      }
    }
  }, [params.id, proposals, signerAddress]);

  // Pomoćne funkcije i izračunavanja
  const totalVotes = proposal ? countTotalVotes(proposal) : 0;
  const quorumPercentage = proposal ? (Number(totalVotes) / Number(QUORUM)) * 100 : 0;
  const quorumRemaining = proposal ? Math.max(0, Number(QUORUM) - Number(totalVotes)) : 0;
  const isQuorumReached = proposal ? Number(totalVotes) >= Number(QUORUM) : false;
  
  const isVotingEnabled = proposal && 
    proposal.status === "open" && 
    !hasVotingTimeExpired(proposal) && 
    proposal.yourVote === "didntVote";
  
  const isMultilayered = proposal?.isMultilayered && proposal.subItems && proposal.subItems.length > 0;

  const handleVoteSelect = (vote: string) => {
    setSelectedVote(vote);
    setIsVoteDialogOpen(true);
    setSelectedSubItemId(null); // Glasamo za glavni predlog
    setSelectedSubItemTitle("");
  };

  const handleSubItemVoteSelect = (subItemId: string, vote: string, title: string) => {
    setSelectedVote(vote);
    setIsVoteDialogOpen(true);
    setSelectedSubItemId(subItemId); // Glasamo za podtačku
    setSelectedSubItemTitle(title);
  };

  const handleVoteCancel = () => {
    setIsVoteDialogOpen(false);
    setSelectedVote(null);
    setSelectedSubItemId(null);
    setSelectedSubItemTitle("");
  };
  
  const handleEndVoting = () => {
    setIsEndVotingDialogOpen(true);
  };
  
  const handleEndVotingCancel = () => {
    setIsEndVotingDialogOpen(false);
  };
  
  const handleEndVotingConfirm = async () => {
    if (!signer || !proposal) return;
    
    setIsEndingVoting(true);
    
    try {
      const result = await endProposalVoting(signer, proposal.id);
      
      if (result) {
        // Osvežavamo podatke - u pravom sistemu bi trebalo osvežiti status predloga
        refreshProposals();
        
        // Za demonstraciju, ažuriramo lokalni predlog
        setProposal({
          ...proposal,
          status: "closed"
        });
      } else {
        setError("Neuspešno zatvaranje glasanja. Pokušajte ponovo.");
      }
    } catch (err) {
      console.error("Greška prilikom zatvaranja glasanja:", err);
      setError("Došlo je do greške prilikom zatvaranja glasanja. Pokušajte ponovo.");
    } finally {
      setIsEndingVoting(false);
      setIsEndVotingDialogOpen(false);
    }
  };

  const handleVoteConfirm = async () => {
    if (!signer || !proposal || !selectedVote) return;
    
    setIsVoting(true);
    
    try {
      // Glasanje za glavni predlog ili podtačku
      let votePrompt = `Glasate ${selectedVote === 'for' ? 'ZA' : selectedVote === 'against' ? 'PROTIV' : 'UZDRŽANO'} `;
      votePrompt += selectedSubItemId ? 'podtačku predloga' : 'predlog';
      console.log(votePrompt);
      
      const result = await castVoteOnProposal(
        signer,
        proposal.id,
        selectedVote as VoteOption,
        selectedSubItemId
      );
      
      if (result) {
        // Osvežavamo podatke
        refreshProposals();
        
        // Ažuriramo lokalni predlog
        if (selectedSubItemId && proposal.subItems) {
          const updatedSubItems = proposal.subItems.map(item =>
            item.id === selectedSubItemId
              ? { ...item, yourVote: selectedVote as VoteOption }
              : item
          );
          
          setProposal({
            ...proposal,
            subItems: updatedSubItems
          });
        } else {
          setProposal({
            ...proposal,
            yourVote: selectedVote as VoteOption
          });
        }
      } else {
        setError("Neuspešno glasanje. Pokušajte ponovo.");
      }
    } catch (err) {
      console.error("Greška prilikom glasanja:", err);
      setError("Došlo je do greške prilikom glasanja. Pokušajte ponovo.");
    } finally {
      setIsVoting(false);
      setIsVoteDialogOpen(false);
      setSelectedVote(null);
      setSelectedSubItemId(null);
      setSelectedSubItemTitle("");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Greška</h1>
        <p className="text-muted-foreground text-center mb-6">
          {error || "Nije moguće učitati detalje predloga."}
        </p>
        <Button onClick={() => router.push('/dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Nazad na listu predloga
        </Button>
      </div>
    );
  }

  const authorName = convertAddressToName(proposal.author) || 
    proposal.author.substring(0, 6) + "..." + proposal.author.substring(proposal.author.length - 4);

  return (
    <div className="min-h-screen bg-muted/30 pb-10">
      <div className="w-full px-4 py-8">
        <div className="w-full mx-auto"> {/* Prikaz po celoj širini */}
          {/* Navigacija nazad */}
          <div className="mb-6 flex justify-between items-center">
            <Button variant="ghost" onClick={() => router.push('/dashboard')} className="pl-0">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Nazad
            </Button>
            
            
          </div>

          {/* Glavni blok sa detaljem predloga */}
          <Card className="mb-8 border-border/40 shadow-sm">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h1 className="text-2xl font-bold">{proposal.title}</h1>
                    <StatusBadge 
                      status={proposal.status} 
                      expiresAt={proposal.closesAt} 
                      quorumReached={isQuorumReached}
                    />
                    {proposal.yourVote !== "didntVote" && (
                      <YourVoteBadge vote={proposal.yourVote} />
                    )}
                    {isAuthor && (
                      <AuthorBadge isAuthor={isAuthor} />
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>{authorName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Dodato: {formatDate(proposal.dateAdded)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>Zatvaranje: {formatDate(proposal.closesAt)}</span>
                    </div>
                  </div>
                </div>

                {isMultilayered && (
                  <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm">
                    <Layers className="h-4 w-4" />
                    <span>Višeslojni predlog ({proposal.subItems?.length} podtačaka)</span>
                  </div>
                )}
              </div>
              
              {/* Tekst predloga */}
              <CardDescription className="text-base whitespace-pre-wrap pt-3">
                {proposal.description}
              </CardDescription>
            </CardHeader>

            <CardContent>
              {/* Stanje kvoruma */}
              <div className="mb-6">
                <div className="flex justify-between items-center text-sm mb-1">
                  <span className="text-muted-foreground">Kvorum</span>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{quorumPercentage.toFixed(0)}%</span>
                    {quorumRemaining > 0 && (
                      <span className="text-xs text-muted-foreground">(još {quorumRemaining} glasova)</span>
                    )}
                    {isQuorumReached && (
                      <Badge variant="outline" className="bg-green-500/10 text-green-700 ml-2 text-xs">
                        <Check className="h-3 w-3 mr-1" />
                        Kvorum dostignut
                      </Badge>
                    )}
                  </div>
                </div>
                <Progress value={quorumPercentage} className="h-2" />
              </div>
              
              {/* Informacija o vremenu i kvorumu */}
              {proposal.status === "open" && !isQuorumReached && (
                <Alert className="mb-6 bg-blue-50 border-blue-200">
                  <Info className="h-4 w-4" />
                  <AlertTitle>Čeka se dostizanje kvoruma</AlertTitle>
                  <AlertDescription>
                    Vreme za glasanje počinje tek kada se dostigne kvorum od {QUORUM} glasova. 
                    Trenutno ima {totalVotes} od potrebnih {QUORUM} glasova.
                  </AlertDescription>
                </Alert>
              )}

              {/* Rezultati glasanja */}
              <div className="mb-6">
                <h3 className="font-medium text-sm mb-3">Rezultati glasanja u načelu</h3>
                <VoteResultBar 
                  votesFor={proposal.votesFor || 0} 
                  votesAgainst={proposal.votesAgainst || 0} 
                  votesAbstain={proposal.votesAbstain || 0} 
                />
              </div>

              {/* Status glasanja */}
              {proposal.status === "closed" && (
                <Alert className={proposal.votesFor > proposal.votesAgainst ? 
                  "bg-green-50 border-green-200 text-green-700" :
                  "bg-red-50 border-red-200 text-red-700"
                }>
                  {proposal.votesFor > proposal.votesAgainst ? 
                    <CheckCircle2 className="h-4 w-4" /> :
                    <XCircle className="h-4 w-4" />
                  }
                  <AlertTitle>
                    Glasanje je završeno - Predlog je {proposal.votesFor > proposal.votesAgainst ? "prihvaćen" : "odbijen"}
                  </AlertTitle>
                  <AlertDescription>
                    {proposal.votesFor > proposal.votesAgainst ?
                      `Glasanje je uspešno završeno ${formatDate(proposal.closesAt)} sa većinom glasova ZA.` :
                      `Glasanje je završeno ${formatDate(proposal.closesAt)} sa većinom glasova PROTIV.`
                    }
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>

            {/* Dugmad za glasanje u načelu - samo ako korisnik nije glasao i glasanje je otvoreno */}
            {isVotingEnabled && (
              <CardFooter className="flex gap-2 pt-2 border-t">
                <h3 className="font-medium text-sm w-full mb-2">Glasanje o predlogu u načelu</h3>
              </CardFooter>
            )}
            
            {isVotingEnabled && (
              <CardFooter className="flex gap-2 pt-0">
                <VoteButton 
                  type="for" 
                  onClick={() => handleVoteSelect("for")} 
                />
                <VoteButton 
                  type="against" 
                  onClick={() => handleVoteSelect("against")} 
                />
                <VoteButton 
                  type="abstain" 
                  onClick={() => handleVoteSelect("abstain")} 
                />
              </CardFooter>
            )}
          </Card>
          
          {/* Sekcija za podtačke višeslojnog predloga */}
          {isMultilayered && (
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Podtačke predloga
              </h2>
              
              {/* Prikazujemo sve podtačke jednu ispod druge */}
              <div className="space-y-6">
                {proposal.subItems?.map((subItem) => (
                  <SubItemVoting 
                    key={subItem.id} 
                    subItem={subItem} 
                    isVotingEnabled={!!isVotingEnabled}
                    onVote={handleSubItemVoteSelect}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Dialog za potvrdu glasanja */}
      <VoteConfirm 
        isOpen={isVoteDialogOpen}
        onClose={handleVoteCancel}
        onConfirm={handleVoteConfirm}
        vote={selectedVote || ""}
        isLoading={isVoting}
        subItemTitle={selectedSubItemTitle}
      />
      
      {/* Dialog za potvrdu završetka plenuma */}
      <EndVotingConfirm
        isOpen={isEndVotingDialogOpen}
        onClose={handleEndVotingCancel}
        onConfirm={handleEndVotingConfirm}
        isLoading={isEndingVoting}
      />
    </div>
  );
}
