import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { STRINGS } from "@/constants/strings";
import { ProposalCard } from "@/components/ProposalCard/proposal-card";
import { getTestProposal } from "../test/dummy-objects";

global.ResizeObserver = require("resize-observer-polyfill");

describe("ProposalCard", () => {
  it("Doesn't show the vote button if proposal state is cancelled", async () => {
    render(
      <ProposalCard proposal={getTestProposal("cancelled")} isUrgent={false} />
    );
    expect(
      screen.queryByText(STRINGS.proposalCard.voteButton)
    ).not.toBeInTheDocument();
  });
  it("Doesn't show the vote button if proposal state is closed", async () => {
    render(
      <ProposalCard proposal={getTestProposal("closed")} isUrgent={false} />
    );
    expect(
      screen.queryByText(STRINGS.proposalCard.voteButton)
    ).not.toBeInTheDocument();
  });
  it("Shows the vote button if proposal state is open", async () => {
    render(
      <ProposalCard proposal={getTestProposal("open")} isUrgent={false} />
    );
    expect(
      screen.queryByText(STRINGS.proposalCard.voteButton)
    ).toBeInTheDocument();
  });
});
