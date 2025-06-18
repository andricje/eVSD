"use client";
import { Proposal } from "@/types/proposal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { PerFacultyVotes, VoteItemInfo } from "../VoteItemInfo/vote-item-info";
import { useRef } from "react";

interface ProposalInfoProps {
  proposal: Proposal;
}
export function ProposalInfo({ proposal }: ProposalInfoProps) {
  return (
    <>
      <div className="flex flex-col gap-4">
        {proposal.voteItems.map((voteItem, index) => {
          const triggerRef = useRef<HTMLButtonElement>(null);

          return (
            <div
              className="flex flex-col cursor-pointer"
              key={voteItem.id}
              onClick={() => triggerRef.current?.click()}
            >
              <div className="flex flex-col gap-2 lg:flex-row lg:justify-between lg:items-center w-full">
                <div className="lg:max-w-[350px] xl:max-w-full">
                  <p className="text-sm font-semibold">
                    {index + 1}. {voteItem.title}
                  </p>
                </div>
                <VoteItemInfo voteItem={voteItem} proposal={proposal} />
              </div>
              <Accordion type="single" collapsible>
                <AccordionItem value="item-1" className="border-b-0">
                  <AccordionTrigger ref={triggerRef} className="hidden" />
                  <AccordionContent>
                    <PerFacultyVotes voteItem={voteItem} />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          );
        })}
      </div>
    </>
  );
}
