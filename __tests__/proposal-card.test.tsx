import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { STRINGS } from "@/constants/strings";
import { ProposalCard } from "@/components/ProposalCard/proposal-card";
import { getTestProposal } from "../test/dummy-objects";

jest.mock("../hooks/use-userservice", () => ({
  useUserService: jest.fn(),
}));
global.ResizeObserver = require("resize-observer-polyfill");

const quorum = 5;
describe("ProposalCard", () => {
  it("Doesn't show the vote button if proposal state is cancelled", async () => {
    render(
      <ProposalCard
        proposal={getTestProposal("cancelled")}
        canVote
        quorum={quorum}
      />
    );
    expect(
      screen.queryByText(STRINGS.proposalCard.voteButton)
    ).not.toBeInTheDocument();
  });
  it("Doesn't show the vote button if proposal state is closed", async () => {
    render(
      <ProposalCard
        proposal={getTestProposal("closed")}
        canVote
        quorum={quorum}
      />
    );
    expect(
      screen.queryByText(STRINGS.proposalCard.voteButton)
    ).not.toBeInTheDocument();
  });
  it("Doesn't show the vote button if current user is not an eligible voter", async () => {
    render(
      <ProposalCard
        proposal={getTestProposal("open")}
        quorum={quorum}
        canVote={false}
      />
    );
    expect(
      screen.queryByText(STRINGS.proposalCard.voteButton)
    ).not.toBeInTheDocument();
  });
  it("Shows the vote button if proposal state is open", async () => {
    render(
      <ProposalCard
        proposal={getTestProposal("open")}
        canVote
        quorum={quorum}
      />
    );
    expect(
      screen.queryByText(STRINGS.proposalCard.voteButton)
    ).toBeInTheDocument();
  });
});
