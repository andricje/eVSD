"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserActivityEvent } from "@/types/proposal";
import { Timer, Activity } from "lucide-react";
import { useProposals } from "@/hooks/use-proposals";
import { useWallet } from "@/context/wallet-context";
import { Timeline } from "./timeline";
import { useEffect, useState } from "react";
import { UserProposals } from "./user-proposals";
import { STRINGS } from "@/constants/strings";

export function UserActivity() {
  const { proposals, proposalService } = useProposals();
  const { user } = useWallet();

  const [activity, setActivity] = useState<UserActivityEvent[]>([]);
  useEffect(() => {
    async function getUserActivity() {
      if (proposalService) {
        setActivity(await proposalService.getAllUserActivity());
      }
    }
    getUserActivity();
  }, [proposalService]);

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
        <UserProposals proposals={proposals} user={user} />
      </TabsContent>

      {/* Sve aktivnosti */}
      <TabsContent value="aktivnosti">
        <Timeline userActivity={activity} />
      </TabsContent>
    </Tabs>
  );
}
