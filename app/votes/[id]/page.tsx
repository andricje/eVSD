"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ThumbsDown,
  ThumbsUp,
  UserCheck,
  AlertTriangle,
  Layers,
  User as UserIcon,
  Timer,
  Calendar,
  Clock,
  FileText,
} from "lucide-react";

import { useProposals } from "@/hooks/use-proposals";
import {
  countVoteForOption,
  Proposal,
  VotableItem,
  VoteOption,
  User,
} from "@/types/proposal";
import {
  formatDate,
  getRemainingTime,
  hasVotingTimeExpired,
} from "@/lib/utils";
import { addressNameMap } from "@/constants/address-name-map";
import { useWallet } from "@/context/wallet-context";
import { PinataProposalFileService } from "@/lib/proposal-services/pinata-proposal-file-service";

// VoteConfirm komponenta
const VoteConfirm: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  vote: string;
  isLoading: boolean;
  subItemTitle?: string;
}> = ({ isOpen, onClose, onConfirm, vote, isLoading, subItemTitle }) => {
  if (!isOpen) {
    return null;
  }

  let voteText = "Uzdržan";
  if (vote === "for") {
    voteText = "ZA";
  }
  if (vote === "against") {
    voteText = "PROTIV";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>Potvrda glasanja</CardTitle>
          <CardDescription>
            {subItemTitle
              ? `Potvrđujete glas za podtačku: ${subItemTitle}`
              : "Potvrđujete vaš glas na ovom predlogu"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center p-4">
            {vote === "for" && (
              <ThumbsUp className="h-16 w-16 mx-auto text-green-500 mb-4" />
            )}
            {vote === "against" && (
              <ThumbsDown className="h-16 w-16 mx-auto text-red-500 mb-4" />
            )}
            {vote === "abstain" && (
              <UserCheck className="h-16 w-16 mx-auto text-amber-500 mb-4" />
            )}
            <p className="text-lg font-medium">Glasaćete {voteText}</p>
            <p className="text-muted-foreground mt-2">
              Nakon potvrde vaš glas je trajno zabeležen i ne može se promeniti.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Otkaži
          </Button>
          <Button onClick={onConfirm} disabled={isLoading}>
            {isLoading ? "Slanje..." : "Potvrdi glas"}
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
        ${active ? activeClass : "bg-transparent"} 
        ${disabled ? "opacity-50" : colorClass}`}
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
          <span>
            Za: {votesFor} ({forPercent.toFixed(1)}%)
          </span>
        </div>
        <div className="flex items-center">
          <span className="h-2 w-2 rounded-full bg-red-500 mr-1"></span>
          <span>
            Protiv: {votesAgainst} ({againstPercent.toFixed(1)}%)
          </span>
        </div>
        <div className="flex items-center">
          <span className="h-2 w-2 rounded-full bg-amber-500 mr-1"></span>
          <span>
            Uzdržani: {votesAbstain} ({abstainPercent.toFixed(1)}%)
          </span>
        </div>
      </div>
    </div>
  );
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

// SubItemVoting komponenta za glasanje na podtačkama
const SubItemVoting: React.FC<{
  subItem: VotableItem;
  currentUser: User | null;
  onVote: (id: string, vote: VoteOption, title: string) => void;
}> = ({ subItem, currentUser: currentUser, onVote }) => {
  const isVotingEnabled = currentUser && currentUser.address in addressNameMap;
  const yourVote =
    (currentUser && subItem.userVotes.get(currentUser.address)?.vote) ??
    "didntVote";

  return (
    <Card className="border-border/40 mb-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{subItem.title}</CardTitle>
          {yourVote !== "didntVote" && <YourVoteBadge vote={yourVote} />}
        </div>
        <CardDescription className="whitespace-pre-wrap">
          {subItem.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <VoteResultBar
          votesFor={countVoteForOption(subItem, "for")}
          votesAgainst={countVoteForOption(subItem, "against")}
          votesAbstain={countVoteForOption(subItem, "abstain")}
        />
      </CardContent>
      {isVotingEnabled && yourVote === "didntVote" && (
        <CardFooter className="flex gap-2 pt-0">
          <VoteButton
            type="for"
            onClick={() => onVote(subItem.id.toString(), "for", subItem.title)}
          />
          <VoteButton
            type="against"
            onClick={() =>
              onVote(subItem.id.toString(), "against", subItem.title)
            }
          />
          <VoteButton
            type="abstain"
            onClick={() =>
              onVote(subItem.id.toString(), "abstain", subItem.title)
            }
          />
        </CardFooter>
      )}
    </Card>
  );
};
// AuthorBadge komponenta - prikazuje da li je korisnik autor predloga
const AuthorBadge = ({ isAuthor }: { isAuthor: boolean }) => {
  if (!isAuthor) {
    return null;
  }

  return (
    <Badge className="bg-blue-500/10 text-blue-700 border-blue-200">
      <UserIcon className="h-3 w-3 mr-1" /> Vaš predlog
    </Badge>
  );
};

// Glavna komponenta za prikaz detalja predloga i glasanje
export default function ProposalDetails() {
  const params = useParams();
  const router = useRouter();
  const { user } = useWallet();
  const { proposals, proposalService } = useProposals();

  const [error, setError] = useState("");

  // Stanja za glasanje
  const [selectedVote, setSelectedVote] = useState<VoteOption | null>(null);
  const [isVoteDialogOpen, setIsVoteDialogOpen] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [selectedSubItemId, setSelectedVoteItemId] = useState<string | null>(
    null
  );
  const [selectedSubItemTitle, setSelectedVoteItemTitle] = useState<string>("");
  const proposal = proposals.find((p) => p.id.toString() === params.id);
  const isAuthor = proposal && proposal.author === user;

  const downloadFileByHash = async (hash: string) => {
    const fileService = new PinataProposalFileService();
    const file = await fileService.download(hash);
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = hash;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSubItemVoteSelect = (
    voteItemId: string,
    vote: VoteOption,
    title: string
  ) => {
    setSelectedVote(vote);
    setIsVoteDialogOpen(true);
    setSelectedVoteItemId(voteItemId);
    setSelectedVoteItemTitle(title);
  };

  const handleVoteCancel = () => {
    setIsVoteDialogOpen(false);
    setSelectedVote(null);
    setSelectedVoteItemId(null);
    setSelectedVoteItemTitle("");
  };
  const handleVoteConfirm = async () => {
    if (!proposal || !selectedVote || !proposalService) {
      return;
    }

    setIsVoting(true);

    try {
      let votePrompt = `Glasate ${selectedVote === "for" ? "ZA" : selectedVote === "against" ? "PROTIV" : "UZDRŽANO"} `;
      votePrompt += selectedSubItemId ? "podtačku predloga" : "predlog";
      console.log(votePrompt);

      const voteItem = proposal.voteItems.find(
        (voteItem) => voteItem.id.toString() === selectedSubItemId
      );

      if (voteItem) {
        await proposalService.voteForItem(voteItem, selectedVote as VoteOption);
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
      setSelectedVoteItemId(null);
      setSelectedVoteItemTitle("");
    }
  };

  if (error || !proposal) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Greška</h1>
        <p className="text-muted-foreground text-center mb-6">
          {error || "Nije moguće učitati detalje predloga."}
        </p>
        <Button onClick={() => router.push("/dashboard")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Nazad na listu predloga
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 pb-10">
      <div className="w-full px-4 py-8">
        <div className="w-full mx-auto">
          {" "}
          {/* Prikaz po celoj širini */}
          {/* Navigacija nazad */}
          <div className="mb-6 flex justify-between items-center">
            <Button
              variant="ghost"
              onClick={() => router.push("/dashboard")}
              className="pl-0"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Nazad
            </Button>
          </div>
          <Card className="mb-8 border-border/40 shadow-sm">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h1 className="text-2xl font-bold">{proposal.title}</h1>
                    <StatusBadge proposal={proposal} />
                    {isAuthor && <AuthorBadge isAuthor={isAuthor} />}
                  </div>

                  <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <UserIcon className="h-4 w-4" />
                      <span>{proposal.author.address}</span>
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
              </div>

              {/* Tekst predloga */}
              <CardDescription className="text-base whitespace-pre-wrap pt-3">
                {proposal.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {proposal.fileHash && (
                <Button
                  onClick={async () =>
                    await downloadFileByHash(proposal.fileHash!)
                  }
                >
                  <FileText className="h-4.5 w-4.5 mr-2.5" />
                  Preuzmi predlog
                </Button>
              )}
            </CardContent>
          </Card>
          {/* Sekcija za podtačke višeslojnog predloga */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Podtačke predloga
            </h2>

            {/* Prikazujemo sve podtačke jednu ispod druge */}
            <div className="space-y-6">
              {proposal.voteItems.map((subItem) => (
                <SubItemVoting
                  key={subItem.id}
                  subItem={subItem}
                  currentUser={user}
                  onVote={handleSubItemVoteSelect}
                />
              ))}
            </div>
          </div>
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
    </div>
  );
}

// StatusBadge komponenta
const StatusBadge = ({ proposal }: { proposal: Proposal }) => {
  if (proposal.status === "closed") {
    return (
      <Badge
        variant="outline"
        className="bg-gray-500/10 text-gray-700 border-gray-200"
      >
        Glasanje zatvoreno
      </Badge>
    );
  } else if (hasVotingTimeExpired(proposal)) {
    return (
      <Badge
        variant="outline"
        className="bg-gray-500/10 text-gray-700 border-gray-200"
      >
        Glasanje isteklo
      </Badge>
    );
  } else {
    return (
      <Badge
        variant="outline"
        className="bg-amber-500/10 text-amber-700 border-amber-200"
      >
        <Timer className="h-3 w-3 mr-1" />
        {getRemainingTime(proposal.closesAt)}
      </Badge>
    );
  }
};
