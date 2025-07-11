import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { User, VotableItem, VoteEvent, VoteOption } from "@/types/proposal";
import { STRINGS } from "@/constants/strings";
import { VoteItemInfo } from "@/components/VoteItemInfo/vote-item-info";
import { v4 as uuidv4 } from "uuid";
import { getTranslatedVoteOptionWithCount } from "@/lib/utils";

global.ResizeObserver = require("resize-observer-polyfill");

function generateUserVote(voteOption: VoteOption) {
  const user: User = {
    address: uuidv4(),
    name: uuidv4(),
  };
  const evt: VoteEvent = {
    vote: voteOption,
    date: new Date(),
    voter: user,
  };
  return { address: user.address, event: evt };
}

function getVoteItem(
  votesFor: number,
  votesAgainst: number,
  votesAbstain: number
) {
  const votes = new Map<string, VoteEvent>();
  for (let i = 0; i < votesFor; i++) {
    const { address, event } = generateUserVote("for");
    votes.set(address, event);
  }
  for (let i = 0; i < votesAbstain; i++) {
    const { address, event } = generateUserVote("abstain");
    votes.set(address, event);
  }
  for (let i = 0; i < votesAgainst; i++) {
    const { address, event } = generateUserVote("against");
    votes.set(address, event);
  }
  const voteItem: VotableItem = {
    id: 123456n,
    title: "Test votable item",
    description: "Description",
    userVotes: votes,
  };
  return voteItem;
}

const quorum = 5;
describe("VoteItemInfo", () => {
  it("Shows the correct number of votes", async () => {
    const voteItem = getVoteItem(10, 3, 5);
    render(
      <VoteItemInfo voteItem={voteItem} proposalState="open" quorum={quorum} />
    );
    expect(
      screen.getByText(getTranslatedVoteOptionWithCount("for", 10))
    ).toBeInTheDocument();
    expect(
      screen.getByText(getTranslatedVoteOptionWithCount("against", 3))
    ).toBeInTheDocument();
    expect(
      screen.getByText(getTranslatedVoteOptionWithCount("abstain", 5))
    ).toBeInTheDocument();
  });

  it("Shows passed when there are quorum + 5 votes for and there are no other votes and voting is complete", async () => {
    const voteItem = getVoteItem(quorum + 5, 0, 0);
    render(
      <VoteItemInfo
        voteItem={voteItem}
        proposalState="closed"
        quorum={quorum}
      />
    );
    expect(screen.getByText(STRINGS.voting.results.passed)).toBeInTheDocument();
  });

  it("Shows failed when there are quorum + 5 votes against and there are no other votes and voting is complete", async () => {
    const voteItem = getVoteItem(0, quorum + 5, 0);
    render(
      <VoteItemInfo
        voteItem={voteItem}
        proposalState="closed"
        quorum={quorum}
      />
    );
    expect(screen.getByText(STRINGS.voting.results.failed)).toBeInTheDocument();
  });

  it("Shows quorum not reached when quorum - 1 people vote and voting is complete", async () => {
    const voteItem = getVoteItem(quorum - 1, 0, 0);
    render(
      <VoteItemInfo
        voteItem={voteItem}
        proposalState="closed"
        quorum={quorum}
      />
    );
    // The badge includes the vote count, e.g. "No quorum 4/5"
    expect(
      screen.getByText(
        (content, node) =>
          typeof content === "string" &&
          content.startsWith(STRINGS.voting.results.noQuorum)
      )
    ).toBeInTheDocument();
  });

  it("Shows active badge when voting is not complete", async () => {
    const voteItem = getVoteItem(1, 1, 1);
    render(
      <VoteItemInfo voteItem={voteItem} proposalState="open" quorum={quorum} />
    );
    expect(screen.getByText(STRINGS.proposal.statusActive)).toBeInTheDocument();
  });
});
