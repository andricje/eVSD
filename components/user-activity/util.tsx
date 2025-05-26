import { STRINGS } from "@/constants/strings";
import { IsUserActivityVote, UserActivityEvent } from "../user-activity";

export function getTextForActivityEvent(activityEvt: UserActivityEvent)
{
    if(IsUserActivityVote(activityEvt))
    {
        let voteOptionTranslated;
        switch(activityEvt.voteEvent.vote)
        {
            case "for": 
                voteOptionTranslated = STRINGS.voteOptions.for; 
                break;
            case "against": 
                voteOptionTranslated = STRINGS.voteOptions.against; 
                break;
            case "abstain": 
                voteOptionTranslated = STRINGS.voteOptions.abstain; 
                break;
        }
        return `${STRINGS.userActivity.timeLine.youVoted} ${voteOptionTranslated}`;
    }
    else
    {
        switch(activityEvt.type)
        {
            case "Create": return `${STRINGS.userActivity.timeLine.created}: ${activityEvt.proposal.title}`;
            case "Delete": return `${STRINGS.userActivity.timeLine.deleted}: ${activityEvt.proposal.title}`;
        }
    }
}