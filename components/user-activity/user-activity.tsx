"use client";
import { useEffect, useMemo, useState } from "react";
import { Timer, Activity } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { STRINGS } from "@/constants/strings";
import { useProposals } from "@/hooks/use-proposals";
import { Proposal, UserActivityEvent } from "@/types/proposal";
import { Timeline } from "./timeline";
import { UserProposals } from "./user-proposals";
import {
  ActivitySkeleton,
  MyProposalsSkeleton,
} from "../loadingSkeletons/loadingSkeletons";
import { useUserService } from "@/hooks/use-userservice";

export function UserActivity() {
  const {
    proposals,
    proposalService,
    loading: proposalsLoading,
  } = useProposals();
  const { currentUser: user } = useUserService();

  const [activity, setActivity] = useState<UserActivityEvent[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState<boolean>(true);

  useEffect(() => {
    async function getUserActivity() {
      if (proposalService && user) {
        setActivitiesLoading(true);
        setActivity(await proposalService.getAllUserActivity(user));
        setActivitiesLoading(false);
      }
    }
    getUserActivity();
  }, [proposalService, user]);

  // Filtriranje predloga trenutno ulogovanog korisnika
  const userProposals: Proposal[] = useMemo(
    () =>
      proposals && user
        ? proposals.filter((p) => p.author.address === user.address)
        : [],
    [proposals, user]
  );

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

  return (
    <Tabs defaultValue="predlozi">
      <TabsList className="w-full grid grid-cols-2 mb-6">
        <TabsTrigger value="predlozi">
          <span className="flex items-center gap-2">
            <Timer className="w-4 h-4" />
            {STRINGS.userActivity.userProposals.title}
          </span>
        </TabsTrigger>
        <TabsTrigger value="aktivnosti" className="rounded-r-lg">
          <span className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            {STRINGS.userActivity.timeLine.title}
          </span>
        </TabsTrigger>
      </TabsList>

      {/* Moji predlozi */}
      <TabsContent value="predlozi">
        {proposalsLoading ? (
          <MyProposalsSkeleton />
        ) : (
          <UserProposals proposals={userProposals} user={user} />
        )}
      </TabsContent>

      {/* Sve aktivnosti */}
      <TabsContent value="aktivnosti">
        {activitiesLoading ? (
          <ActivitySkeleton />
        ) : (
          <Timeline userActivity={activity} />
        )}
      </TabsContent>
    </Tabs>
  );
}
