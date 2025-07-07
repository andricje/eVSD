"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  PieChart,
  Users,
  Vote,
  X,
  History,
  User as UserIcon,
} from "lucide-react";

import { NewProposalDialog } from "@/components/new-proposal-dialog";
import { WalletInfo as OriginalWalletInfo } from "@/components/wallet-info";
import { UserActivity } from "@/components/user-activity/user-activity";
import { useWallet } from "@/context/wallet-context";
import { useProposals } from "@/hooks/use-proposals";
import { Proposal, User } from "@/types/proposal";
import { getQuorumVotesText, isVotingComplete, QUORUM } from "@/lib/utils";
import { ProposalCard } from "@/components/ProposalCard/proposal-card";
import { NewVoterDialog } from "@/components/new-proposal-add-voter-dialog";
import { MembershipAcceptanceDialog } from "../../components/membership-acceptance-dialog";
import { useRouter } from "next/navigation";
import { ProposalService } from "@/lib/proposal-services/proposal-service";
import { WalletAddress } from "@/components/wallet-address";
import { Header } from "@/components/header";
import {
  CardsSkeleton,
  WalletInfoSkeleton,
} from "@/components/loadingSkeletons/loadingSkeletons";
import { useUserService } from "@/hooks/use-userservice";

// Action Buttons
const ActionButtons: React.FC<{ isAdmin: boolean }> = () => {
  const { disconnect } = useWallet();
  const { currentUser } = useUserService();
  const router = useRouter();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full">
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
          <PieChart className="size-4 mr-2" />
          Резултати
        </Link>
      </Button>
      <div className="hidden sm:flex border-l border-border h-8 mx-2" />
      {currentUser && (
        <Button
          size="sm"
          className="flex-1 border border-border/40 py-3 text-sm h-full bg-destructive text-destructive-foreground hover:bg-destructive sm:bg-background sm:text-foreground sm:hover:bg-background sm:hover:text-destructive"
          onClick={() => {
            disconnect();
            router.push("/");
          }}
        >
          <X className="size-4 mr-1.5" /> Одјави се
        </Button>
      )}
    </div>
  );
};

// SystemAnnouncements Component

// ActiveMembers Component
const ActiveMembers: React.FC = () => {
  const { allUsers } = useUserService();
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 sm:justify-between sm:items-center mb-2">
        <h2 className="text-lg font-semibold text-foreground">
          Активни чланови еВСД
        </h2>

        <NewVoterDialog />
      </div>
      <Card className="p-4 bg-background border border-border/40 rounded-xl shadow-md">
        <div className="space-y-3">
          {allUsers?.map((user) => (
            <div
              key={user.address}
              className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
            >
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <UserIcon className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <div>
                  <WalletAddress
                    address={user.address}
                    className="text-sm font-medium ml-1"
                    iconSize={3}
                  />
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs px-1.5 py-0">
                      {user.name}
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
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("voting");

  const { loading: walletLoading } = useWallet();
  const { currentUser: user } = useUserService();
  const {
    proposals,
    proposalService,
    loading: proposalsLoading,
    setLoading: setProposalsLoading,
  } = useProposals();
  const proposalToVote = user ? getProposalsToVote(proposals, user) : [];

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, []);

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
  }, [user, proposalService, setProposalsLoading]);

  // Funkcije za rukovanje prihvatanjem/odbijanjem članstva
  const handleAcceptMembership = async () => {
    setProposalsLoading(true);
    await proposalService?.acceptVotingRights();
    setProposalsLoading(false);
    setShowMembershipDialog(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-muted/30">
      <Header showNav={false} />

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
              {walletLoading ? (
                <WalletInfoSkeleton />
              ) : (
                user && <OriginalWalletInfo showName={true} />
              )}
              <div className="flex w-full md:w-auto gap-3">
                <ActionButtons isAdmin={false} />
              </div>
            </div>
          </div>

          {/* Main tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
            <TabsList className="grid grid-cols-3 w-full bg-muted/50 p-1">
              <TabsTrigger value="voting" className="text-sm py-2 font-medium">
                <Vote className="h-4 w-4 mr-2 hidden sm:block" />
                Гласање
              </TabsTrigger>
              <TabsTrigger
                value="activity"
                className="text-sm py-2 font-medium"
              >
                <History className="h-4 w-4 mr-2 hidden sm:block" />
                Активност
              </TabsTrigger>
              <TabsTrigger value="members" className="text-sm py-2 font-medium">
                <Users className="h-4 w-4 mr-2 hidden sm:block" />
                Чланови
              </TabsTrigger>
            </TabsList>

            {/* Voting tab */}
            <TabsContent value="voting" className="mt-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <h2 className="text-lg font-semibold text-foreground">
                  Предлози за гласање
                </h2>
                <Badge variant="outline" className="text-sm px-3 py-1">
                  <Users className="h-4 w-4 mr-1.5" />
                  Кворум: {QUORUM} {getQuorumVotesText()}
                </Badge>
              </div>

              {proposalsLoading ? (
                <CardsSkeleton />
              ) : (
                <>
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
                        Тренутно нема активних предлога за гласање. Можете
                        додати нови предлог.
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
                </>
              )}

              {/* <div className="mt-7 grid grid-cols-1 md:grid-cols-2 gap-6">
                <SystemAnnouncements />
                <ActiveMembers />
              </div> */}
            </TabsContent>

            {/* Activity tab */}
            <TabsContent value="activity" className="mt-5">
              <h2 className="text-lg font-semibold text-foreground mb-5">
                Моје активности
              </h2>
              <UserActivity />
            </TabsContent>

            <TabsContent value="members" className="mt-5">
              <div>
                <ActiveMembers />
              </div>
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
