"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  Bell, 
  ChevronRight, 
  Clock, 
  FileText, 
  LayoutDashboard, 
  PieChart, 
  Plus, 
  Users, 
  Vote, 
  Wallet,
  AlertTriangle,
  CheckCircle2,
  X,
  Calendar,
  History,
  Timer,
  Megaphone,
  Newspaper,
  ListChecks,
  Shield,
  User
} from "lucide-react";

import { NewProposalDialog } from "@/components/new-proposal-dialog";
import { NewAnnouncementDialog } from "@/components/new-announcement-dialog";
import { AnnouncementManager } from "@/components/announcement-manager";
import { WalletInfo as OriginalWalletInfo } from "@/components/wallet-info";
import { Header } from "@/components/header";
import { UserActivity } from "@/components/user-activity";
import { FacultyAnnouncements } from "@/components/faculty-announcements";
import { useWallet } from "@/context/wallet-context";
import { useProposals } from "@/hooks/use-proposals";
import { Proposal } from "@/types/proposal";
import {
  getRemainingTime,
  hasVotingTimeExpired,
  isVotingComplete,
  formatDate,
  isQuorumReached,
  countTotalVotes,
  QUORUM,
  formatDateString,
  convertAddressToName,
} from "@/lib/utils";
import { AddFacultyAddress } from "@/components/add-faculty-address";

// Compact WalletInfo Component
const CompactWalletInfo: React.FC<{ address: string }> = ({ address }) => {
  const { disconnect } = useWallet();
  // Simulacija podataka o fakultetu - ovo bi trebalo dobiti iz konteksta korisnika
  const userFaculty = "Електротехнички факултет";
  const userRole = "Студент";

  return (
    <Card className="p-5 bg-background border border-border/40 rounded-xl shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-primary/10 rounded-full">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-base font-semibold text-foreground">
                {address.substring(0, 6)}...{address.substring(address.length - 4)}
              </p>
              <Badge variant="outline" className="text-sm bg-blue-500/10 text-blue-700 border-blue-200">
                {userRole}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">Повезан новчаник</p>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="secondary" className="px-2 py-0.5">
                <User className="h-3.5 w-3.5 mr-1" />
                {userFaculty}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="text-right flex flex-col items-end">
            <Button variant="ghost" size="sm" className="h-9 px-3 text-sm">
              Детаљи <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <div>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-9 px-3 text-sm border-border/40 hover:bg-destructive/5 hover:text-destructive"
              onClick={() => disconnect()}
            >
              <X className="h-4 w-4 mr-1.5" /> Одјави се
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

// Action Buttons
const ActionButtons: React.FC<{ isAdmin: boolean }> = ({ isAdmin }) => {
  return (
    <div className="flex gap-3 h-full w-full">
      <NewProposalDialog 
        customClassName="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 justify-center h-full py-3 text-sm font-medium"
        customText={<><FileText className="h-2 w-4.5 mr-2" />Нови предлог</>}
      />
      {isAdmin && (
        <NewAnnouncementDialog 
          customClassName="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 justify-center h-full py-3 text-sm font-medium"
          customText={<><Megaphone className="h-4.5 w-4.5 mr-2" />Новo Обраћање</>}
        />
      )}
      <Button variant="outline" className="flex-1 border border-primary/20 hover:bg-primary/5 text-primary font-medium py-3 text-sm h-full" asChild>
        <Link href="/rezultati">
          <PieChart className="h-4.5 w-4.5 mr-2" />
          Резултати
        </Link>
      </Button>
    </div>
  );
};

// Status badge
const StatusBadge = ({
  status,
  expiresAt,
  isUrgent,
}: {
  status: string;
  expiresAt?: Date;
  isUrgent?: boolean;
}) => {
  if (isUrgent) {
    return <Badge variant="destructive" className="text-xs px-2 py-0.5 font-medium">Хитно</Badge>;
  } else if (status === "closed") {
    return <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-200 text-xs font-medium px-2">Затворено</Badge>;
  } else if (status === "expired") {
    return <Badge variant="outline" className="bg-gray-500/10 text-gray-700 border-gray-200 text-xs font-medium px-2">Истекло</Badge>;
  } else if (status === "expiring" && expiresAt) {
    return (
      <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-200 text-xs font-medium px-2">
        <Timer className="h-3 w-3 mr-1" />
        {getRemainingTime(expiresAt)}
      </Badge>
    );
  } else {
    return <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-200 text-xs font-medium px-2">Активно</Badge>;
  }
};

// Vote Badge
const VoteBadge = ({ vote }: { vote: string }) => {
  if (vote === "for") {
    return <Badge className="bg-green-500/10 text-green-700 border-green-200 text-xs font-medium px-2">За</Badge>;
  } else if (vote === "against") {
    return <Badge className="bg-red-500/10 text-red-700 border-red-200 text-xs font-medium px-2">Против</Badge>;
  } else {
    return <Badge variant="outline" className="text-xs font-medium px-2">Уздржан</Badge>;
  }
};

// ProposalCard Component - Proširena sa dodatnim informacijama
const ProposalCard: React.FC<{ proposal: Proposal; isUrgent?: boolean }> = ({ proposal, isUrgent = false }) => {
  const timeLeft = Math.max(0, proposal.closesAt ? proposal.closesAt.getTime() - new Date().getTime() : 0);
  const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  
  const totalVotes = countTotalVotes(proposal);
  const quorumPercentage = (Number(totalVotes) / Number(QUORUM)) * 100;
  const quorumRemaining = Math.max(0, Number(QUORUM) - Number(totalVotes));
  const quorumReached = isQuorumReached(proposal);
    
  const forPercentage = proposal.votesFor && (proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain) > 0 ? 
    (Number(proposal.votesFor) / (Number(proposal.votesFor) + Number(proposal.votesAgainst) + Number(proposal.votesAbstain))) * 100 : 0;
  
  const authorName = convertAddressToName(proposal.author) || proposal.author.substring(0, 6) + "..." + proposal.author.substring(proposal.author.length - 4);
  
  return (
    <Card className={`bg-background border ${isUrgent ? 'border-destructive/30' : 'border-border/40'} rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden`}>
      <CardHeader className="pb-2.5 pt-4 px-5">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold text-foreground">{proposal.title}</CardTitle>
            <div className="flex items-center gap-1.5">
              <StatusBadge 
                status={isUrgent ? "expiring" : proposal.status} 
                expiresAt={proposal.closesAt} 
                isUrgent={isUrgent}
              />
              {proposal.isMultilayered && (
                <Badge variant="outline" className="bg-purple-500/10 text-purple-700 border-purple-200 text-xs font-medium px-2">
                  <ListChecks className="h-3 w-3 mr-1" />
                  Вишеслојни
                </Badge>
              )}
            </div>
          </div>
          {quorumReached && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 px-2.5 py-1 rounded-md">
              <Clock className="h-4 w-4 text-amber-600" />
              <span className="font-medium">{hoursLeft}ч {minutesLeft}м</span>
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{proposal.description}</p>
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
            <span className="text-muted-foreground">Кворум</span>
            <div className="flex items-center gap-1.5">
              <span className="font-medium">{quorumPercentage.toFixed(0)}%</span>
              {quorumRemaining > 0 && (
                <span className="text-xs text-muted-foreground">(још {quorumRemaining} гласова)</span>
              )}
            </div>
          </div>
          <Progress value={quorumPercentage} className="h-2" />
        </div>
        
        <div className="pt-1.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium">За:</span>
              <span className="text-sm">{proposal.votesFor || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium">Против:</span>
              <span className="text-sm">{proposal.votesAgainst || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium">Уздржани:</span>
              <span className="text-sm">{proposal.votesAbstain || 0}</span>
            </div>
          </div>
          
          <Button size="sm" className="text-sm px-4 py-2 h-auto font-medium" asChild>
            <Link href={`/votes/${proposal.id}`}>
              <Vote className="h-4 w-4 mr-2" />
              Гласај
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Function to categorize proposals
function categorizeProposals(proposals: Proposal[]) {
  // Aktivni predlozi za koje korisnik NIJE glasao
  const activeProposalsToVote = proposals.filter(
    (proposal: Proposal) =>
      proposal.status === "open" &&
      !hasVotingTimeExpired(proposal) &&
      proposal.yourVote === "didntVote"
  );

  // Predlozi za koje je korisnik glasao i glasanje je završeno
  const votedCompletedProposals = proposals.filter(
    (proposal: Proposal) =>
      proposal.yourVote !== "didntVote" && isVotingComplete(proposal)
  );

  // Svi predlozi za koje je korisnik glasao
  const votedProposals = proposals.filter(
    (proposal: Proposal) => proposal.yourVote !== "didntVote"
  );

  // Predlozi gde korisnik treba da glasa, sa dostupnim kvorumom
  const proposalsWithQuorum = activeProposalsToVote.filter(isQuorumReached);

  const proposalsWithoutQuorum = activeProposalsToVote.filter(
    (p: Proposal) => !isQuorumReached(p)
  );

  return {
    activeProposalsToVote,
    votedCompletedProposals,
    votedProposals,
    proposalsWithQuorum,
    proposalsWithoutQuorum,
  };
}

// UrgentProposals Component
const UrgentProposals: React.FC<{ proposals: Proposal[] }> = ({ proposals }) => {
  if (proposals.length === 0) return null;
  
  return (
    <div className="mt-6">
      <Alert className="bg-destructive/10 border-destructive/30 text-foreground py-3 px-5">
        <AlertTriangle className="h-5 w-5 text-destructive" />
        <AlertTitle className="text-base font-semibold">Хитни предлози</AlertTitle>
        <AlertDescription className="text-sm">
          Следећи предлози су достигли кворум и захтевају хитно гласање
        </AlertDescription>
      </Alert>
      
      <div className="space-y-4 mt-4">
        {proposals.map((proposal) => (
          <ProposalCard key={proposal.id} proposal={proposal} isUrgent={true} />
        ))}
      </div>
    </div>
  );
};

// AdminTools Component
const AdminTools: React.FC = () => {
  const [showConfirmEndPlenum, setShowConfirmEndPlenum] = useState(false);
  const [showAddFacultyDialog, setShowAddFacultyDialog] = useState(false);
  
  const handleEndPlenum = () => {
    // Ovde bi se pozivala funkcija za završetak plenuma na blockchain nivou
    console.log("Plenum završen");
    setShowConfirmEndPlenum(false);
  };
  
  return (
    <Card className="p-4 bg-background border border-border/40 rounded-xl shadow-md">
      <h3 className="text-base font-semibold text-foreground mb-3">Административне опције</h3>
      <div className="space-y-3">
        <Button 
          className="w-full justify-start py-2 text-sm" 
          variant="outline"
          onClick={() => setShowAddFacultyDialog(true)}
        >
          <Users className="mr-2 h-4 w-4" />
          Додај нову адресу у систем
        </Button>
        <Button className="w-full justify-start py-2 text-sm" variant="outline">
          <Shield className="mr-2 h-4 w-4" />
          Управљање дозволама
        </Button>
        <Button 
          className="w-full justify-start py-2 text-sm" 
          variant="outline" 
          onClick={() => setShowConfirmEndPlenum(true)}
        >
          <Timer className="mr-2 h-4 w-4 text-destructive" />
          <span className="text-destructive">Заврши пленум</span>
        </Button>
        
        {showConfirmEndPlenum && (
          <Alert variant="destructive" className="mt-3">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="text-sm font-semibold">Потврда завршетка пленума</AlertTitle>
            <AlertDescription className="text-sm">
              Да ли сте сигурни да желите да завршите пленум? Ова акција ће онемогућити даље гласање.
              <div className="flex gap-2 mt-3">
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={handleEndPlenum}
                >
                  Да, заврши пленум
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowConfirmEndPlenum(false)}
                >
                  Откажи
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        {showAddFacultyDialog && (
          <Alert className="mt-3 bg-background border border-primary/20">
            <div className="flex justify-between w-full mb-2">
              <AlertTitle className="text-base font-semibold">Додавање нове адресе факултета</AlertTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowAddFacultyDialog(false)} 
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <AlertDescription>
              <AddFacultyAddress onSuccess={() => setShowAddFacultyDialog(false)} />
            </AlertDescription>
          </Alert>
        )}
      </div>
    </Card>
  );
};

// Dashboard component
export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("voting");
  const { proposals, signerAddress } = useProposals();
  const { disconnect } = useWallet();
  const {
    activeProposalsToVote,
    votedCompletedProposals,
    votedProposals,
    proposalsWithQuorum,
    proposalsWithoutQuorum,
  } = categorizeProposals(proposals);

  // Simuliramo admina za UI primer
  const isAdmin = true;
  
  // Status plenuma
  const plenumStatus = "Активан";
  const plenumDate = "15.05.2023.";
  const totalActiveProposals = proposalsWithQuorum.length + proposalsWithoutQuorum.length;
  
  // Додатне информације о кориснику
  const userFaculty = "Електротехнички факултет";
  const userRole = "Студент";
  
  return (
    <div className="flex flex-col min-h-screen bg-muted/30">
      {/* Главно заглавље са платформским информацијама и корисничким подацима */}
      <header className="w-full bg-background border-b px-5 py-3">
        <div className="flex items-center justify-between max-w-full">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">еВСД Платформа</h1>
            <Badge variant="outline" className="text-sm px-3 py-1 bg-green-500/10 text-green-700 border-green-200">
              <Clock className="h-4 w-4 mr-1.5" />
              Пленум: {plenumStatus} од {plenumDate}
            </Badge>
          </div>
          
          {signerAddress && (
            <div className="flex items-center gap-5">
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{signerAddress.substring(0, 6)}...{signerAddress.substring(signerAddress.length - 4)}</span>
                  <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-700 border-blue-200">
                    {userRole}
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>{userFaculty}</span>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 px-3 text-sm border-border/40 hover:bg-destructive/5 hover:text-destructive"
                onClick={() => disconnect()}
              >
                <X className="h-4 w-4 mr-1.5" /> Одјави се
              </Button>
              
              <Avatar className="h-9 w-9">
                <AvatarFallback className="text-sm font-medium">ВС</AvatarFallback>
              </Avatar>
            </div>
          )}
        </div>
      </header>
      
      <main className="flex-1 w-full px-5 py-6">
        <div className="flex flex-col gap-7 max-w-full">
          {/* Platform stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4 bg-background border border-border/40 rounded-xl shadow-md flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 rounded-full">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Активни предлози</p>
                <p className="text-lg font-bold">{totalActiveProposals}</p>
              </div>
            </Card>
            <Card className="p-4 bg-background border border-border/40 rounded-xl shadow-md flex items-center gap-3">
              <div className="p-2.5 bg-green-100 rounded-full">
                <Vote className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Достигли кворум</p>
                <p className="text-lg font-bold">{proposalsWithQuorum.length}</p>
              </div>
            </Card>
            <Card className="p-4 bg-background border border-border/40 rounded-xl shadow-md flex items-center gap-3">
              <div className="p-2.5 bg-amber-100 rounded-full">
                <Users className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Минимални кворум</p>
                <p className="text-lg font-bold">{QUORUM} гласова</p>
              </div>
            </Card>
          </div>
          
          {/* Action Buttons */}
          <div className="flex">
            <ActionButtons isAdmin={isAdmin} />
          </div>
          
          {/* Urgent Proposals */}
          <UrgentProposals proposals={proposalsWithQuorum} />
          
          {/* Main tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
            <TabsList className="grid grid-cols-2 w-full bg-muted/50 p-1">
              <TabsTrigger value="voting" className="text-sm py-2 font-medium">
                <Vote className="h-4 w-4 mr-2" />
                Гласање
              </TabsTrigger>
              <TabsTrigger value="activity" className="text-sm py-2 font-medium">
                <History className="h-4 w-4 mr-2" />
                Активност
              </TabsTrigger>
            </TabsList>
            
            {/* Voting tab */}
            <TabsContent value="voting" className="mt-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Предлози за гласање</h2>
                <Badge variant="outline" className="text-sm px-3 py-1">
                  <Users className="h-4 w-4 mr-1.5" />
                  Кворум: {QUORUM} гласова
                </Badge>
              </div>
              
              {proposalsWithoutQuorum.length > 0 ? (
                <div className="space-y-4 mt-5">
                  {proposalsWithoutQuorum.map((proposal) => (
                    <ProposalCard key={proposal.id} proposal={proposal} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed mt-5">
                  <Vote className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-xl text-foreground font-semibold">
                    Нема активних предлога за гласање
                  </p>
                  <p className="text-muted-foreground mt-3 max-w-md mx-auto text-base">
                    Тренутно нема активних предлога за гласање. Можете додати нови предлог.
                  </p>
                  <div className="mt-6">
                    <NewProposalDialog 
                      customClassName="bg-primary text-primary-foreground hover:bg-primary/90 text-base py-2.5 px-5 font-medium"
                      customText={<><FileText className="h-4.5 w-4.5 mr-2.5" />Креирај нови предлог</>}
                    />
                  </div>
                </div>
              )}
              
              <div className="mt-7 grid grid-cols-1 md:grid-cols-2 gap-6">
                <FacultyAnnouncements />
                {isAdmin && <AdminTools />}
              </div>
            </TabsContent>
            
            {/* Activity tab */}
            <TabsContent value="activity" className="mt-5">
              <h2 className="text-lg font-semibold text-foreground mb-5">Моје активности</h2>
              <UserActivity />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <footer className="border-t py-6 w-full bg-background mt-6">
        <div className="w-full flex flex-col items-center justify-between gap-4 px-5 md:flex-row">
          <p className="text-center text-sm text-muted-foreground md:text-left font-medium">
            &copy; {new Date().getFullYear()} еВСД. Сва права задржана.
          </p>
          <div className="flex items-center gap-5">
            <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground font-medium">Документација</Link>
            <Link href="/support" className="text-sm text-muted-foreground hover:text-foreground font-medium">Подршка</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
