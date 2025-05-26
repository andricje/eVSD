import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { Proposal } from '@/types/proposal';
import { STRINGS } from '@/constants/strings';
import { ProposalCard } from '@/components/ProposalCard/proposal-card';

global.ResizeObserver = require('resize-observer-polyfill')

function getTestProposal(status: 'open' | 'closed' | 'cancelled')
{
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const proposal : Proposal = {
        id: 0n,
        title: 'Test proposal',
        description: 'Test proposal description',
        author: {
            address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
            name: 'Fakultet 1'
        },
        dateAdded: today,
        status,
        closesAt: tomorrow,
        voteItems: []
    };   
    return proposal;
}

describe('NewProposalDialog', () => {
  it("Doesn't show the vote button if proposal state is cancelled", async () => {
    render(<ProposalCard proposal={getTestProposal('cancelled')} isUrgent={false} />);
    expect(screen.queryByText(STRINGS.proposalCard.voteButton)).not.toBeInTheDocument();
  });
  it("Doesn't show the vote button if proposal state is closed", async () => {
    render(<ProposalCard proposal={getTestProposal('closed')} isUrgent={false} />);
    expect(screen.queryByText(STRINGS.proposalCard.voteButton)).not.toBeInTheDocument();
  });
  it("Shows the vote button if proposal state is open", async () => {
    render(<ProposalCard proposal={getTestProposal('open')} isUrgent={false} />);
    expect(screen.queryByText(STRINGS.proposalCard.voteButton)).toBeInTheDocument();
  });
});
