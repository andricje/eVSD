import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { User, VotableItem, VoteEvent, VoteOption } from "@/types/proposal";
import { STRINGS } from "@/constants/strings";
import { VoteItemInfo } from "@/components/VoteItemInfo/vote-item-info";
import { v4 as uuidv4 } from "uuid";
import { getTranslatedVoteOptionWithCount, QUORUM } from "@/lib/utils";
import { StatusBadge } from "@/components/badges";

global.ResizeObserver = require("resize-observer-polyfill");

describe("StatusBadge", () => {
  it("Shows active when status=open and expiration time is one hour from now", async () => {
    const expirationTime = new Date();
    expirationTime.setHours(expirationTime.getHours() + 1);

    render(<StatusBadge status="open" expiresAt={expirationTime} />);
    expect(screen.getByText(STRINGS.proposal.statusActive)).toBeInTheDocument();
  });
  it("Shows canceled when status=closed and expiration time is one hour from now", async () => {
    const expirationTime = new Date();
    expirationTime.setHours(expirationTime.getHours() + 1);

    render(<StatusBadge status="cancelled" expiresAt={expirationTime} />);
    expect(
      screen.getByText(STRINGS.proposal.statusCancelled)
    ).toBeInTheDocument();
  });
  it("Shows closed when status=closed and expiration time is one hour before now", async () => {
    const expirationTime = new Date();
    expirationTime.setHours(expirationTime.getHours() - 1);

    render(<StatusBadge status="closed" expiresAt={expirationTime} />);
    expect(screen.getByText(STRINGS.proposal.statusClosed)).toBeInTheDocument();
  });
  it("Shows closed even when status=open and expiration time is one hour before now", async () => {
    const expirationTime = new Date();
    expirationTime.setHours(expirationTime.getHours() - 1);

    render(<StatusBadge status="open" expiresAt={expirationTime} />);
    expect(screen.getByText(STRINGS.proposal.statusClosed)).toBeInTheDocument();
  });
});
