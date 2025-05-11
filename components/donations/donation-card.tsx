import React from "react";
import moment from "moment";

import { Donation } from "@/types/donors";

interface DonationCardProps {
  donation: Donation;
}

export function DonationCard({ donation }: DonationCardProps) {
  const displayName = donation.donor.anonymous
    ? "Анонимни донатор"
    : donation.donor.name;

  return (
    <li key={donation.id} className="flex flex-row justify-between">
      <div className="hidden">
        bg-green-400 bg-orange-400 bg-yellow-400 bg-red-400 bg-blue-400
      </div>
      <div className="flex items-center gap-4">
        {donation.donor.anonymous ? (
          <div className="w-10 h-10 rounded-full bg-gray-500"></div>
        ) : donation.donor.avatar && donation.donor.avatarApproved ? (
          <img
            src={donation.donor.avatar}
            className="w-10 h-10 rounded-full object-cover"
            alt={donation.donor.name || donation.donor.walletAddress}
          />
        ) : (
          <div
            className={`w-10 h-10 rounded-full ${donation.donor.color || "bg-blue-500"}`}
          ></div>
        )}

        <div className="flex-1">
          <p className="font-medium">
            {displayName}{" "}
            <span className="text-gray-500">
              {donation.donor.walletAddress}
            </span>
          </p>
          <p className="text-sm text-muted-foreground">
            {donation.amount} ETH{" "}
            <span>({moment(donation.dateTime).fromNow()})</span>
          </p>
        </div>
      </div>
      <div className="flex items-center">
        <p className="text-xl">
          {!donation.donor.anonymous && (
            <span
              className={`fi fi-${donation.donor.countryCode || "rs"} fis rounded-full`}
            ></span>
          )}
        </p>
      </div>
    </li>
  );
}
