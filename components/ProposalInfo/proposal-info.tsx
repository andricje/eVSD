"use client";
import { useRef } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";

import { Proposal, User } from "@/types/proposal";
import { PerFacultyVotes, VoteItemInfo } from "../VoteItemInfo/vote-item-info";
import { Badge } from "../ui/badge";
import { ThumbsDown, ThumbsUp, UserCheck } from "lucide-react";

interface ProposalInfoProps {
  proposal: Proposal;
  usersToFollow: User[];
  quorum: number;
}

export function ProposalInfo({
  proposal,
  usersToFollow = [],
  quorum,
}: ProposalInfoProps) {
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
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-2 lg:flex-row lg:justify-between lg:items-center w-full">
                  <div className="lg:max-w-[350px] xl:max-w-full">
                    <p className="text-sm font-semibold">
                      {index + 1}. {voteItem.title}
                    </p>
                  </div>
                  <VoteItemInfo
                    voteItem={voteItem}
                    proposalState={proposal.status}
                    quorum={quorum}
                  />
                </div>
                {usersToFollow?.length > 0 && (
                  <div>
                    <h4 className="text-sm text-gray-500">
                      Гласови одабраних корисника:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {usersToFollow.map((user) => {
                        const vote = voteItem.userVotes.get(user.address);
                        if (!vote) return null;
                        return (
                          <Badge
                            key={user.address}
                            variant="outline"
                            className={`flex flex-row gap-2 items-center ${vote.vote === "for" ? "border-green-500" : vote.vote === "against" ? "border-red-500" : ""}`}
                          >
                            {vote.vote === "for" ? (
                              <ThumbsUp className="text-green-500 size-3" />
                            ) : vote.vote === "against" ? (
                              <ThumbsDown className="text-red-500 size-3" />
                            ) : (
                              <UserCheck className="size-3" />
                            )}
                            <span
                              className={`${vote.vote === "for" ? "text-green-500" : vote.vote === "against" ? "text-red-500" : ""}`}
                            >
                              {user.name}
                            </span>
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
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
