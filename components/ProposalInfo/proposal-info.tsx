import { Proposal } from "@/types/proposal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { PerFacultyVotes, VoteItemInfo } from "../VoteItemInfo/vote-item-info";

interface ProposalInfoProps {
  proposal: Proposal;
}
export function ProposalInfo({ proposal }: ProposalInfoProps) {
  return (
    <Accordion type="single" collapsible className="w-full md:w-1/2">
      {proposal.voteItems.map((voteItem) => (
        <AccordionItem value="item-1" key={voteItem.id}>
          <AccordionTrigger>
            <p>{voteItem.title}</p> <VoteItemInfo voteItem={voteItem} />
          </AccordionTrigger>
          <AccordionContent>
            <PerFacultyVotes voteItem={voteItem} />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
