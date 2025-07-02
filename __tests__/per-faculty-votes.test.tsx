import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import { PerFacultyVotes } from "@/components/VoteItemInfo/vote-item-info";
import { getDummyVoters, getVoteItem } from "../test/dummy-objects";
import { getTranslatedVoteOption, convertAddressToName } from "@/lib/utils";
import { User } from "@/types/proposal";

global.ResizeObserver = require("resize-observer-polyfill");

const getByTextContent = (text: string) => {
  return screen.getByText((content, element) => {
    const hasText = (element: Element | null) => element?.textContent === text;
    const elementHasText = hasText(element);
    const childrenDontHaveText = Array.from(element?.children || []).every(
      (child) => !hasText(child)
    );
    return elementHasText && childrenDontHaveText;
  });
};

describe("NewProposalDialog", () => {
  let dummyVoters: User[];
  beforeAll(() => {
    dummyVoters = getDummyVoters(10);
    const mockAddrMap = dummyVoters.reduce(
      (acc, item) => {
        acc[item.address] = item.name;
        return acc;
      },
      {} as Record<string, string>
    );

    (convertAddressToName as jest.Mock).mockImplementation((addr: string) => {
      return mockAddrMap[addr];
    });
  });
  it("Shows all faculties that did cast a vote", async () => {
    const voteItem = getVoteItem(["for", "against", "abstain"], dummyVoters);
    render(<PerFacultyVotes voteItem={voteItem} />);
    const names = dummyVoters.map((voter) => voter.name);
    expect(screen.getByText(names[0])).toBeInTheDocument();
    expect(screen.getByText(names[1])).toBeInTheDocument();
    expect(screen.getByText(names[2])).toBeInTheDocument();
  });
  it("Doesn't show a faculty that didn't cast a vote", async () => {
    const voteItem = getVoteItem(["for", "against", "abstain"], dummyVoters);
    render(<PerFacultyVotes voteItem={voteItem} />);
    const names = dummyVoters.map((voter) => voter.name);
    expect(screen.queryByText(names[3])).not.toBeInTheDocument();
  });
  it("Correctly shows what each faculty voted", async () => {
    const voteItem = getVoteItem(
      ["for", "against", "abstain", "for"],
      dummyVoters
    );
    render(<PerFacultyVotes voteItem={voteItem} />);
    const names = dummyVoters.map((voter) => voter.name);
    expect(
      getByTextContent(`${names[0]}${getTranslatedVoteOption("for")}`)
    ).toBeInTheDocument();
  });
});
