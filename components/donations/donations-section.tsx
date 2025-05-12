"use client";

import React, { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Calendar, Coins, Info } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import "/node_modules/flag-icons/css/flag-icons.min.css";

import { testDonations } from "@/types/donors";
import { DonationCard } from "./donation-card";
import { NewDonationDialog } from "./new-donation-dialog";

export function DonationsSection() {
  const [sortBy, setSortBy] = useState<string>("latest");

  const sortedDonations = [...testDonations].sort((a, b) => {
    if (sortBy === "amount") return b.amount - a.amount;
    return 0;
  });

  return (
    <>
      <section className="w-full py-12">
        <div className="w-full max-w-full px-4 md:px-6 lg:px-8 flex flex-col lg:flex-row gap-12">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm h-96 py-8 lg:py-0 flex-1 relative">
            <TooltipProvider>
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <div className="absolute top-4 right-4 cursor-pointer text-muted-foreground">
                    <Info size={18} />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p className="max-w-xs text-sm">
                    Средства која се прикупљају путем донација користе се за
                    подршку рада еВСД платформе.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="flex w-full h-full justify-center items-center flex-col">
              <h4 className="text-lg">Доступна средства</h4>
              <h5 className="text-4xl font-semibold leading-none tracking-tight pt-2">
                14.001251 ETH
              </h5>
              <h6 className="text-sm text-muted-foreground pt-2 mb-6">
                Укупно донирано: 26.216351 ETH
              </h6>
              <NewDonationDialog />
            </div>
          </div>

          <div className="rounded-lg border bg-card text-card-foreground shadow-sm h-96 flex-1 relative p-4">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h4 className="text-lg font-medium">Забележене донације</h4>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="max-w-[180px]">
                  <div className="flex items-center gap-2">
                    {sortBy === "latest" ? (
                      <Calendar className="h-4 w-4" />
                    ) : (
                      <Coins className="h-4 w-4" />
                    )}
                    <SelectValue placeholder="Сортирање донације" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">Хронолошки</SelectItem>
                  <SelectItem value="amount">По износу</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <ul
              className="space-y-3 overflow-auto pr-2"
              style={{ maxHeight: "calc(100% - 48px)" }}
            >
              {sortedDonations.map((donation) => (
                <DonationCard donation={donation} key={donation.id} />
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
