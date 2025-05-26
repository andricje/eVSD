import { STRINGS } from "@/constants/strings";
import { IsUserActivityVote, UserActivityEvent } from "./user-activity";

export function getTextForActivityEvent(activityEvt: UserActivityEvent) {
    if (IsUserActivityVote(activityEvt)) {
        let voteOptionTranslated;
        switch (activityEvt.voteEvent.vote) {
            case "for":
                voteOptionTranslated = STRINGS.voting.voteOptions.for;
                break;
            case "against":
                voteOptionTranslated = STRINGS.voting.voteOptions.against;
                break;
            case "abstain":
                voteOptionTranslated = STRINGS.voting.voteOptions.abstain;
                break;
        }
        return `${STRINGS.userActivity.timeLine.youVoted} ${voteOptionTranslated} (${STRINGS.voting.proposal}: ${activityEvt.proposal.title}, ${STRINGS.voting.voteItem}: ${activityEvt.voteItem.title})`;
    }
    else {
        switch (activityEvt.type) {
            case "Create": return `${STRINGS.userActivity.timeLine.created}: ${activityEvt.proposal.title}`;
            case "Delete": return `${STRINGS.userActivity.timeLine.deleted}: ${activityEvt.proposal.title}`;
        }
    }
}