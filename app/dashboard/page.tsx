"use client";

import React, { useState, useEffect } from "react";
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
  X,
  History,
  User as UserIcon,
  Bell,
  CheckCircle2,
  AlertCircle,
  Info,
} from "lucide-react";

import { NewProposalDialog } from "@/components/new-proposal-dialog";
import { WalletInfo as OriginalWalletInfo } from "@/components/wallet-info";
import { UserActivity } from "@/components/user-activity/user-activity";
import { useWallet } from "@/context/wallet-context";
import { useProposals } from "@/hooks/use-proposals";
import { Proposal, User } from "@/types/proposal";
import { isVotingComplete, formatDate, QUORUM } from "@/lib/utils";
import { ProposalCard } from "@/components/ProposalCard/proposal-card";
import { NewVoterDialog } from "@/components/new-proposal-add-voter-dialog";
import { MembershipAcceptanceDialog } from "../../components/membership-acceptance-dialog";
import { useRouter } from "next/navigation";
import { addressNameMap } from "@/constants/address-name-map";
import { ProposalService } from "@/lib/proposal-services/proposal-service";

// Action Buttons
const ActionButtons: React.FC<{ isAdmin: boolean }> = ({ isAdmin }) => {
  const { disconnect, user } = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user]);

  return (
    <div className="flex gap-3 w-full">
      <NewProposalDialog
        customClassName="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 justify-center h-full py-3 text-sm font-medium"
        customText={
          <>
            <FileText className="h-4 w-4 mr-2" />
            Нови предлог
          </>
        }
      />
      <Button
        variant="outline"
        className="flex-1 border border-primary/20 hover:bg-primary/5 text-primary font-medium py-3 text-sm h-full"
        asChild
      >
        <Link href="/rezultati">
          <PieChart className="h-4 w-4 mr-2" />
          Резултати
        </Link>
      </Button>
      <div className="border-l border-border h-8 mx-2" />
      <Button
        variant="outline"
        size="sm"
        className="flex-1 border border-border/40 hover:bg-destructive/5 hover:text-destructive py-3 text-sm h-full"
        onClick={() => {
          disconnect();
          router.push("/");
        }}
      >
        <X className="h-4 w-4 mr-1.5" /> Одјави се
      </Button>
    </div>
  );
};

// Compact WalletInfo Component
const CompactWalletInfo: React.FC<{ address: string }> = ({ address }) => {
  // Simulacija podataka o fakultetu - ovo bi trebalo dobiti iz konteksta korisnika
  const userFaculty = "Електротехнички факултет";

  return (
    <div className="flex items-center justify-between bg-background py-4 px-2 rounded-lg">
      <div className="flex items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-primary" />
            <p className="text-base font-semibold text-foreground uppercase">
              {userFaculty}
            </p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="px-2 py-0.5 text-sm">
              <span className="text-muted-foreground">
                {address.substring(0, 6)}...
                {address.substring(address.length - 4)}
              </span>
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

// SystemAnnouncements Component
const SystemAnnouncements: React.FC = () => {
  const announcements = [
    {
      id: 1,
      title: "Ажурирање система",
      date: new Date(),
      content:
        "Обавештавамо вас да ће систем бити недоступан због планираног одржавања у суботу од 22:00 до 23:00 часова.",
      type: "info",
      icon: Info,
    },
    {
      id: 2,
      title: "Успешно завршено гласање",
      date: new Date(Date.now() - 24 * 60 * 60 * 1000),
      content:
        "Гласање за предлог 'Измене правилника о студирању' је успешно завршено са постигнутим кворумом.",
      type: "success",
      icon: CheckCircle2,
    },
    {
      id: 3,
      title: "Важно обавештење",
      date: new Date(Date.now() - 48 * 60 * 60 * 1000),
      content:
        "Потребно је да сви корисници ажурирају своје профиле најкасније до 15.12. ради усклађивања са новим прописима.",
      type: "warning",
      icon: AlertCircle,
    },
  ];

  const getIconBgColor = (type: string) => {
    switch (type) {
      case "info":
        return "bg-blue-100";
      case "success":
        return "bg-green-100";
      case "warning":
        return "bg-amber-100";
      default:
        return "bg-gray-100";
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case "info":
        return "text-blue-600";
      case "success":
        return "text-green-600";
      case "warning":
        return "text-amber-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-foreground mb-2 flex items-center">
        <Bell className="h-4 w-4 mr-2" />
        Обавештења система
      </h2>
      {announcements.map((announcement) => (
        <Card
          key={announcement.id}
          className="p-4 bg-background border border-border/40 rounded-xl shadow-md hover:shadow-lg transition-shadow"
        >
          <div className="flex items-start gap-3">
            <div
              className={`p-2 ${getIconBgColor(announcement.type)} rounded-full mt-1`}
            >
              <announcement.icon
                className={`h-4 w-4 ${getIconColor(announcement.type)}`}
              />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-base font-medium text-foreground">
                  {announcement.title}
                </h4>
                <span className="text-xs text-muted-foreground">
                  {formatDate(announcement.date)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {announcement.content}
              </p>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                Детаљније <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

// ActiveMembers Component
const ActiveMembers: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-base font-semibold text-foreground flex items-center">
          <Users className="h-4 w-4 mr-2" />
          Активни чланови еВСД
        </h2>
        <NewVoterDialog />
      </div>
      <Card className="p-4 bg-background border border-border/40 rounded-xl shadow-md">
        <div className="space-y-3">
          {Object.entries(addressNameMap).map(([address, name]) => (
            <div
              key={address}
              className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
            >
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <UserIcon className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium">{address}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs px-1.5 py-0">
                      {name}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
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
  const { proposals, proposalService } = useProposals();
  const proposalToVote = user ? getProposalsToVote(proposals, user) : [];

  // Stanje za prikazivanje popup-a za prihvatanje članstva
  const [showMembershipDialog, setShowMembershipDialog] = useState(false);

  useEffect(() => {
    // Proveravamo da li je korisnik novi član koji treba da prihvati članstvo
    const checkUserVotingRights = async (
      proposalService: ProposalService,
      user: User
    ) => {
      const canAccept = await proposalService.canUserAcceptVotingRights(user);
      setShowMembershipDialog(canAccept);
    };
    if (user && proposalService) {
      checkUserVotingRights(proposalService, user);
    }
  }, [user, proposalService]);

  // Funkcije za rukovanje prihvatanjem/odbijanjem članstva
  const handleAcceptMembership = async () => {
    await proposalService?.acceptVotingRights();
    setShowMembershipDialog(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-muted/30">
      {/* Dodajemo komponentu za prihvatanje članstva */}
      <MembershipAcceptanceDialog
        isOpen={showMembershipDialog}
        onAccept={handleAcceptMembership}
        onDecline={() => {}}
      />

      <main className="flex-1 w-full px-5 py-8">
        <div className="flex flex-col gap-7 max-w-full">
          {/* Wallet info and actions */}
          <div className="bg-background rounded-xl shadow-sm border border-border/40 p-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {user ? (
                <CompactWalletInfo address={user.address} />
              ) : (
                <OriginalWalletInfo />
              )}
              <div className="flex w-full md:w-auto gap-3">
                <ActionButtons isAdmin={false} />
              </div>
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

              {/* <div className="mt-7 grid grid-cols-1 md:grid-cols-2 gap-6">
                <SystemAnnouncements />
                <ActiveMembers />
              </div> */}
              <div className="mt-7">
                <ActiveMembers />
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
