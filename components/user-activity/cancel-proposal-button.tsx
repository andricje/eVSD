import { Proposal } from "@/types/proposal";
import { X } from "lucide-react";
import { Button } from "../ui/button";
import { useProposals } from "@/hooks/use-proposals";
import { STRINGS } from "@/constants/strings";

export function CancelProposalButton({proposal} : {proposal: Proposal})
{
    const {proposalService} = useProposals();
    return (<Button
    variant="outline"
    size="sm"
    className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
    onClick={() => proposalService?.cancelProposal(proposal)}>
        <X className="h-3.5 w-3.5 mr-1" />
        {STRINGS.buttons.cancelProposal}
    </Button>);
}