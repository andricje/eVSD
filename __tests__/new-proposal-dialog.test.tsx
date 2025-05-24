import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { useProposals } from '../hooks/use-proposals';
import { ProposalsContextValue } from '@/context/proposals-context';
import { InMemoryProposalFileService } from '@/lib/file-upload';
import { InMemoryProposalService } from '@/lib/proposal-services/in-memory-proposal-service';
import { User } from '@/types/proposal';
import { NewProposalDialog } from '@/components/new-proposal-dialog';
import userEvent from '@testing-library/user-event';
import { STRINGS } from '@/constants/strings';


jest.mock('../hooks/use-proposals');

const mockedUseProposals = useProposals as jest.MockedFunction<typeof useProposals>;

describe('NewProposalDialog', () => {
  beforeEach(async ()=> {
    const mockUser : User = {
        address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        name: 'Test Fakultet'
    }
    const proposalService = new InMemoryProposalService(mockUser);
    const mockProposalsReturn: ProposalsContextValue = {
        proposals: await proposalService.getProposals(),
        proposalService
    };
    mockedUseProposals.mockReturnValue(mockProposalsReturn);
  });
  it('Shows an error if proposal title is not filled', async () => {
    render(<NewProposalDialog />);
    fireEvent.click(screen.getByText(STRINGS.newProposal.dialog.addNew));
    
    const titleInput = screen.getByPlaceholderText(STRINGS.newProposal.form.title.placeholder);
    await userEvent.type(titleInput, 'Test naslov');

    const descriptionInput = screen.getByPlaceholderText(STRINGS.newProposal.form.description.placeholder)

    const submitButton = screen.getByText(STRINGS.newProposal.form.submit.default);
    fireEvent.click(submitButton);

    expect(screen.getByText('Грешка')).toBeInTheDocument();
  });
});
