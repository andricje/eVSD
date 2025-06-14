import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, act } from "@testing-library/react";
import { useProposals } from "../hooks/use-proposals";
import { ProposalsContextValue } from "@/context/proposals-context";
import { InMemoryProposalService } from "@/lib/proposal-services/in-memory/in-memory-proposal-service";
import { User } from "@/types/proposal";
import { NewProposalDialog } from "@/components/new-proposal-dialog";
import userEvent from "@testing-library/user-event";
import { STRINGS } from "@/constants/strings";

jest.mock("../hooks/use-proposals");
global.ResizeObserver = require("resize-observer-polyfill");

const mockedUseProposals = useProposals as jest.MockedFunction<
  typeof useProposals
>;

async function addVotingPoint(title: string, description: string) {
  const titleInput = screen.getByPlaceholderText(
    STRINGS.newProposal.form.subItem.title.placeholder
  );
  const descInput = screen.getByPlaceholderText(
    STRINGS.newProposal.form.subItem.description.placeholder
  );
  await userEvent.type(titleInput, title);
  await userEvent.type(descInput, description);
}

describe("NewProposalDialog", () => {
  let uploadProposalSpy: jest.SpiedFunction<
    InMemoryProposalService["uploadProposal"]
  >;
  beforeEach(async () => {
    const mockUser: User = {
      address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      name: "Test Fakultet",
    };
    const proposalService = new InMemoryProposalService(mockUser);

    const originalUploadProposal =
      proposalService.uploadProposal.bind(proposalService);

    uploadProposalSpy = jest.spyOn(proposalService, "uploadProposal");
    uploadProposalSpy.mockImplementation(originalUploadProposal);

    const mockProposalsReturn: ProposalsContextValue = {
      proposals: await proposalService.getProposals(),
      proposalService,
    };
    mockedUseProposals.mockReturnValue(mockProposalsReturn);
  });
  it("Shows an error if proposal description is not filled", async () => {
    render(<NewProposalDialog />);
    fireEvent.click(screen.getByText(STRINGS.newProposal.dialog.addNew));

    const titleInput = screen.getByPlaceholderText(
      STRINGS.newProposal.form.title.placeholder
    );
    await userEvent.type(titleInput, "Test naslov");

    const submitButton = screen.getByText(
      STRINGS.newProposal.form.submit.default
    );
    fireEvent.click(submitButton);
    expect(screen.getByText("Грешка")).toBeInTheDocument();
    expect(uploadProposalSpy).not.toHaveBeenCalled();
  });
  it("Shows an error if there are no voting points", async () => {
    render(<NewProposalDialog />);
    fireEvent.click(screen.getByText(STRINGS.newProposal.dialog.addNew));

    const titleInput = screen.getByPlaceholderText(
      STRINGS.newProposal.form.title.placeholder
    );
    await userEvent.type(titleInput, "Test naslov");

    const descriptionInput = screen.getByPlaceholderText(
      STRINGS.newProposal.form.description.placeholder
    );
    await userEvent.type(descriptionInput, "Test opis");

    const submitButton = screen.getByText(
      STRINGS.newProposal.form.submit.default
    );
    fireEvent.click(submitButton);

    expect(screen.getByText("Грешка")).toBeInTheDocument();
    expect(uploadProposalSpy).not.toHaveBeenCalled();
  });
  it("Calls the correct method from the proposal service if title, description and one voting point are filled", async () => {
    render(<NewProposalDialog />);
    fireEvent.click(screen.getByText(STRINGS.newProposal.dialog.addNew));

    // Fill title and desc
    const titleInput = screen.getByPlaceholderText(
      STRINGS.newProposal.form.title.placeholder
    );
    await userEvent.type(titleInput, "Test naslov");

    const descriptionInput = screen.getByPlaceholderText(
      STRINGS.newProposal.form.description.placeholder
    );
    await userEvent.type(descriptionInput, "Test opis");

    // Fill in the title and description for the new voting point
    await addVotingPoint("Test voting point title", "Voting point description");

    const submitButton = screen.getByText(
      STRINGS.newProposal.form.submit.default
    );
    await act(async () => {
      fireEvent.click(submitButton);
    });

    expect(uploadProposalSpy).toHaveBeenCalled();
  });
});
