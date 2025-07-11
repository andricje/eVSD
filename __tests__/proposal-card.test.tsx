import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { STRINGS } from "@/constants/strings";
import { ProposalCard } from "@/components/ProposalCard/proposal-card";
import { getTestProposal } from "../test/dummy-objects";
import { UserServiceContextType } from "@/context/user-context";
import { useUserService } from "@/hooks/use-userservice";
import { User } from "@/types/proposal";

jest.mock("../hooks/use-userservice", () => ({
  useUserService: jest.fn(),
}));
global.ResizeObserver = require("resize-observer-polyfill");

describe("ProposalCard", () => {
  function mockUserService(isEligibleVoter: boolean = true) {
    const mockUser: User = {
      address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      name: "Test Fakultet",
    };
    const mockUserServiceReturn: UserServiceContextType = {
      currentUser: mockUser,
      allUsers: null,
      getUserForAddress: () => undefined,
      userService: null,
      userError: null,
      isCurrentUserEligibleVoter: isEligibleVoter,
    };
    (useUserService as jest.Mock).mockReturnValue(mockUserServiceReturn);
  }
  beforeEach(() => {
    mockUserService();
  });
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
  it("Doesn't show the vote button if current user is not an eligible voter", async () => {
    mockUserService(false);
    render(
      <ProposalCard
        proposal={getTestProposal("open")}
        isUrgent={false}
        quorum={5}
      />
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
