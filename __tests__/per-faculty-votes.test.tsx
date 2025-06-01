import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { PerFacultyVotes } from "@/components/VoteItemInfo/vote-item-info";
import { addressNameMap } from "@/constants/address-name-map";
import { getVoteItem } from "../test/dummy-objects";
import { getTranslatedVoteOption } from "@/lib/utils";

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
  it("Shows all faculties that did cast a vote", async () => {
    const voteItem = getVoteItem(["for", "against", "abstain"]);
    render(<PerFacultyVotes voteItem={voteItem} />);
    const names = Object.values(addressNameMap);
    expect(screen.getByText(names[0])).toBeInTheDocument();
    expect(screen.getByText(names[1])).toBeInTheDocument();
    expect(screen.getByText(names[2])).toBeInTheDocument();
  });
  it("Doesn't show a faculty that didn't cast a vote", async () => {
    const voteItem = getVoteItem(["for", "against", "abstain"]);
    render(<PerFacultyVotes voteItem={voteItem} />);
    const names = Object.values(addressNameMap);
    expect(screen.queryByText(names[3])).not.toBeInTheDocument();
  });
  it("Correctly shows what each faculty voted", async () => {
    const voteItem = getVoteItem(["for", "against", "abstain", "for"]);
    render(<PerFacultyVotes voteItem={voteItem} />);
    const names = Object.values(addressNameMap);
    expect(
      getByTextContent(`${names[0]}${getTranslatedVoteOption("for")}`)
    ).toBeInTheDocument();
  });
});
