"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  ChevronRight,
  FileText,
  PieChart,
  Users,
  Vote,
  Wallet,
  X,
  History,
  Megaphone,
  User as UserIcon,
} from "lucide-react";

import { NewProposalDialog } from "@/components/new-proposal-dialog";
import { WalletInfo as OriginalWalletInfo } from "@/components/wallet-info";
import { UserActivity } from "@/components/user-activity/user-activity";
import { useWallet } from "@/context/wallet-context";
import { useProposals } from "@/hooks/use-proposals";
import { Proposal, User } from "@/types/proposal";
import {
  hasVotingTimeExpired,
  isVotingComplete,
  formatDate,
  QUORUM,
  countUserRemainingItemsToVote,
  isQuorumReachedForAllPoints,
} from "@/lib/utils";
import { ProposalCard } from "@/components/ProposalCard/proposal-card";
import { NewVoterDialog } from "@/components/new-proposal-add-voter-dialog";

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
                {address.substring(0, 6)}...
                {address.substring(address.length - 4)}
              </p>
              <Badge
                variant="outline"
                className="text-sm bg-blue-500/10 text-blue-700 border-blue-200"
              >
                {userRole}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">Повезан новчаник</p>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="secondary" className="px-2 py-0.5">
                <UserIcon className="h-3.5 w-3.5 mr-1" />
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
    <div className="flex gap-3 w-full">
      <NewProposalDialog
        customClassName="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 justify-center h-full py-3 text-sm font-medium"
        customText={
          <>
            <FileText className="h-2 w-4.5 mr-2" />
            Нови предлог
          </>
        }
      />
      {/* {isAdmin && (
        <NewAnnouncementDialog
          customClassName="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 justify-center h-full py-3 text-sm font-medium"
          customText={
            <>
              <Megaphone className="h-4.5 w-4.5 mr-2" />
              Обраћање
            </>
          }
        />
      )} */}
      <NewVoterDialog />
      <Button
        variant="outline"
        className="flex-1 border border-primary/20 hover:bg-primary/5 text-primary font-medium py-3 text-sm h-full"
        asChild
      >
        <Link href="/rezultati">
          <PieChart className="h-4.5 w-4.5 mr-2" />
          Резултати
        </Link>
      </Button>
    </div>
  );
};

// FacultyAnnouncements Component
const FacultyAnnouncements: React.FC = () => {
  const announcements = [
    {
      id: 1,
      title: "Важно обавештење декана",
      date: new Date(),
      content:
        "Поштовани студенти, обавештавамо вас да су измењени услови за пријаву испита у јануарском року.",
      faculty: "Факултет организационих наука",
    },
    {
      id: 2,
      title: "Промене у распореду наставе",
      date: new Date(Date.now() - 24 * 60 * 60 * 1000),
      content:
        "Због техничких проблема у учионици 201, предавања из предмета Софтверско инжењерство се пребацују у салу 301.",
      faculty: "Електротехнички факултет",
    },
    {
      id: 3,
      title: "Позив на ванредну седницу",
      date: new Date(Date.now() - 48 * 60 * 60 * 1000),
      content:
        "Обавештавају се чланови Студентског парламента да ће ванредна седница бити одржана у среду, 15.12. у 18ч.",
      faculty: "Правни факултет",
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-foreground mb-2">
        Обавештења факултета
      </h2>
      {announcements.map((announcement) => (
        <Card
          key={announcement.id}
          className="p-4 bg-background border border-border/40 rounded-xl shadow-md hover:shadow-lg transition-shadow"
        >
          <div className="flex justify-between items-start mb-2">
            <h4 className="text-base font-medium text-foreground">
              {announcement.title}
            </h4>
            <Badge variant="outline" className="text-xs px-2">
              {announcement.faculty}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            {announcement.content}
          </p>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              {formatDate(announcement.date)}
            </span>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
              Детаљније <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
};

function getProposalsToVote(proposals: Proposal[], user: User) {
  return proposals.filter(
    (proposal) =>
      proposal.voteItems.some((item) => !item.userVotes.has(user.address)) &&
      !isVotingComplete(proposal)
  );
}

// Dashboard component
export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("voting");
  const { user } = useWallet();
  const { proposals } = useProposals();
  const proposalToVote = user ? getProposalsToVote(proposals, user) : [];

  return (
    <div className="flex flex-col min-h-screen bg-muted/30">
      <main className="flex-1 w-full px-5 py-8">
        <div className="flex flex-col gap-7 max-w-full">
          {/* Platform stats */}
          {/* <div className="grid grid-cols-3 gap-4">
            <Card className="p-4 bg-background border border-border/40 rounded-xl shadow-md flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 rounded-full">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Активни предлози
                </p>
                <p className="text-lg font-bold">{totalActiveProposals}</p>
              </div>
            </Card>
            <Card className="p-4 bg-background border border-border/40 rounded-xl shadow-md flex items-center gap-3">
              <div className="p-2.5 bg-green-100 rounded-full">
                <Vote className="h-5 w-5 text-green-600" />
              </div>
            </Card>
            <Card className="p-4 bg-background border border-border/40 rounded-xl shadow-md flex items-center gap-3">
              <div className="p-2.5 bg-amber-100 rounded-full">
                <Users className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Минимални кворум
                </p>
                <p className="text-lg font-bold">{QUORUM} гласова</p>
              </div>
            </Card>
          </div> */}

          {/* Wallet info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-2">
              {user ? (
                <CompactWalletInfo address={user.address} />
              ) : (
                <OriginalWalletInfo />
              )}
            </div>
            <div className="flex items-center">
              <ActionButtons isAdmin={false} />
            </div>
          </div>

          {/* Main tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
            <TabsList className="grid grid-cols-2 w-full bg-muted/50 p-1">
              <TabsTrigger value="voting" className="text-sm py-2 font-medium">
                <Vote className="h-4 w-4 mr-2" />
                Гласање
              </TabsTrigger>
              <TabsTrigger
                value="activity"
                className="text-sm py-2 font-medium"
              >
                <History className="h-4 w-4 mr-2" />
                Активност
              </TabsTrigger>
            </TabsList>

            {/* Voting tab */}
            <TabsContent value="voting" className="mt-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">
                  Предлози за гласање
                </h2>
                <Badge variant="outline" className="text-sm px-3 py-1">
                  <Users className="h-4 w-4 mr-1.5" />
                  Кворум: {QUORUM} гласова
                </Badge>
              </div>

              {proposalToVote.length > 0 ? (
                <div className="space-y-4 mt-5">
                  {proposalToVote.map((proposal) => (
                    <ProposalCard
                      key={proposal.id}
                      proposal={proposal}
                      isUrgent={false}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed mt-5">
                  <Vote className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-xl text-foreground font-semibold">
                    Нема активних предлога за гласање
                  </p>
                  <p className="text-muted-foreground mt-3 max-w-md mx-auto text-base">
                    Тренутно нема активних предлога за гласање. Можете додати
                    нови предлог.
                  </p>
                  <div className="mt-6">
                    <NewProposalDialog
                      customClassName="bg-primary text-primary-foreground hover:bg-primary/90 text-base py-2.5 px-5 font-medium"
                      customText={
                        <>
                          <FileText className="h-4.5 w-4.5 mr-2.5" />
                          Креирај нови предлог
                        </>
                      }
                    />
                  </div>
                </div>
              )}

              <div className="mt-7 grid grid-cols-1 md:grid-cols-2 gap-6">
                <FacultyAnnouncements />
              </div>
            </TabsContent>

            {/* Activity tab */}
            <TabsContent value="activity" className="mt-5">
              <h2 className="text-lg font-semibold text-foreground mb-5">
                Моје активности
              </h2>
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
            <Link
              href="/docs"
              className="text-sm text-muted-foreground hover:text-foreground font-medium"
            >
              Документација
            </Link>
            <Link
              href="/support"
              className="text-sm text-muted-foreground hover:text-foreground font-medium"
            >
              Подршка
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
