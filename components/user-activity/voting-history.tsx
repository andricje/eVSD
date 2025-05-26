import { AlertCircle, CalendarDays, Check, X } from "lucide-react";
import { IsUserActivityVote, UserActivityEvent, UserActivityEventVote } from "../user-activity";
import { formatDate } from "@/lib/utils";
import { getTextForActivityEvent } from "./util";

export function VotingHistory({activity} : {activity: UserActivityEvent[]})
{
    const votingActivity = activity.filter(IsUserActivityVote);
    return (<div className="space-y-3">{votingActivity.map((evt, index) => (
        <div
          key={index}
          className="bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {getVoteIconClass(evt.voteEvent.vote)}
                </div>
                <div>
                  <h3 className="font-medium">
                    {evt.proposal.title ||
                      `Predlog #${evt.proposal.id.toString().substring(0, 8)}...`}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                    <CalendarDays className="h-3 w-3" />
                    <span>{formatDate(evt.date)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div
                className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium
                ${
                  evt.voteEvent.vote === "for"
                    ? "bg-emerald-50 text-emerald-700"
                    : evt.voteEvent.vote === "against"
                      ? "bg-rose-50 text-rose-700"
                      : "bg-gray-100 text-gray-700"
                }`}
              >
                {getTextForActivityEvent(evt)}
              </div>
            </div>
          </div>
        </div>
      ))}</div>);
}

const getVoteIconClass = (vote: string) => {
    if (vote === "for") {
      return <Check className="h-4 w-4 text-emerald-600" />;
    }
    if (vote === "against") {
      return <X className="h-4 w-4 text-rose-600" />;
    }
    return <AlertCircle className="h-4 w-4 text-gray-600" />;
  };
