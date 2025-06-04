import { Check, X, AlertCircle, Activity, FilePlus, FileX } from "lucide-react";
import { IsUserActivityVote, UserActivityEvent } from "@/types/activity";
import { formatDate } from "@/lib/utils";
import { STRINGS } from "@/constants/strings";
import { CancelProposalButton } from "./cancel-proposal-button";
import { getTextForActivityEvent } from "./util";

function getBorderColor(activityEvt: UserActivityEvent) {
  if (IsUserActivityVote(activityEvt)) {
    return activityEvt.voteEvent.vote === "for"
      ? "bg-emerald-50 border border-emerald-200"
      : activityEvt.voteEvent.vote === "against"
        ? "bg-rose-50 border border-rose-200"
        : "bg-gray-50 border border-gray-200";
  } else {
    switch (activityEvt.type) {
      case "Create":
        return "bg-blue-50 border border-blue-200";
      case "Delete":
        return "bg-red-50 border border-red-200";
    }
  }
}

function getIcon(activityEvt: UserActivityEvent) {
  if (IsUserActivityVote(activityEvt)) {
    switch (activityEvt.voteEvent.vote) {
      case "for":
        return <Check className="h-3 w-3 text-emerald-600" />;
      case "against":
        return <X className="h-3 w-3 text-rose-600" />;
      case "abstain":
        return <AlertCircle className="h-3 w-3 text-gray-600" />;
    }
  } else {
    switch (activityEvt.type) {
      case "Create":
        return (
          <FilePlus
            className={`h-3 w-3 ${activityEvt.proposal.status === "open" ? "text-blue-600" : "text-gray-600"}`}
          />
        );
      case "Delete":
        return <FileX className="h-3 w-3 text-red-600" />;
    }
  }
}

export function Timeline({
  userActivity,
}: {
  userActivity: UserActivityEvent[];
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">
        {STRINGS.userActivity.timeLine.title}
      </h2>

      <div className="relative">
        <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200"></div>
        <div className="space-y-4 pl-10 relative">
          {userActivity
            .sort((a, b) => {
              return b.date.getTime() - a.date.getTime(); // Od najnovijeg do najstarijeg
            })
            .map((activity, index) => (
              <div key={index} className="relative">
                <div className="absolute -left-10 mt-1">
                  <div
                    className={`h-6 w-6 rounded-full flex items-center justify-center ${getBorderColor(activity)}`}
                  >
                    {getIcon(activity)}
                  </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">
                        {getTextForActivityEvent(activity)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatDate(activity.date)}
                      </div>
                    </div>
                    {!IsUserActivityVote(activity) &&
                      activity.proposal.status === "open" && (
                        <CancelProposalButton proposal={activity.proposal} />
                      )}
                  </div>
                </div>
              </div>
            ))}

          {userActivity.length === 0 && (
            <div className="rounded-xl bg-gray-50 p-8 text-center">
              <Activity className="mx-auto h-10 w-10 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium">
                {STRINGS.userActivity.timeLine.noActivity}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {STRINGS.userActivity.timeLine.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
