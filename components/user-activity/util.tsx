import { STRINGS } from "@/constants/strings";
import { IsUserActivityVote, UserActivityEvent } from "./user-activity";
import { getTranslatedVoteOption } from "@/lib/utils";

export function getTextForActivityEvent(activityEvt: UserActivityEvent) {
    if (IsUserActivityVote(activityEvt)) {
        const voteOptionTranslated = getTranslatedVoteOption(activityEvt.voteEvent.vote);
        return `${STRINGS.userActivity.timeLine.youVoted} ${voteOptionTranslated} (${STRINGS.voting.proposal}: ${activityEvt.proposal.title}, ${STRINGS.voting.voteItem}: ${activityEvt.voteItem.title})`;
    }
    else {
        switch (activityEvt.type) {
            case "Create": return `${STRINGS.userActivity.timeLine.created}: ${activityEvt.proposal.title}`;
            case "Delete": return `${STRINGS.userActivity.timeLine.deleted}: ${activityEvt.proposal.title}`;
        }
    }
}