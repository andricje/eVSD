import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { Proposal, User, VotableItem, VoteEvent, VoteOption } from '@/types/proposal';
import { STRINGS } from '@/constants/strings';
import { ProposalCard } from '@/components/ProposalCard/proposal-card';
import { PerFacultyVotes, VoteItemInfo } from '@/components/VoteItemInfo/vote-item-info';
import {v4 as uuidv4} from 'uuid';
import { getTranslatedVoteOption, getTranslatedVoteOptionWithCount, QUORUM } from '@/lib/utils';

global.ResizeObserver = require('resize-observer-polyfill')

function getVoteItem()
{
    const votes = new Map<string, VoteEvent>();
    votes.set("Fakultet 1",{
        vote: "for",
        date: new Date(),
        voter: {
            address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
            name: "Fakultet 1"
        }
    })
    votes.set("Fakultet 2",{
        vote: "against",
        date: new Date(),
        voter: {
            address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
            name: "Fakultet 2"
        }
    })
    votes.set("Fakultet 3",{
        vote: "abstain",
        date: new Date(),
        voter: {
            address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
            name: "Fakultet 3"
        }
    })
    const voteItem : VotableItem = {
        id: 123456n,
        title: 'Test votable item',
        description: 'Description',
        userVotes: votes
    };
    return voteItem;
}

describe('NewProposalDialog', () => {
  it("Shows all faculties that did cast a vote", async () => {
    const voteItem = getVoteItem();
    render(<PerFacultyVotes voteItem={voteItem} />);
    expect(screen.getByText("Fakultet 1")).toBeInTheDocument();
    expect(screen.getByText("Fakultet 2")).toBeInTheDocument();
    expect(screen.getByText("Fakultet 3")).toBeInTheDocument();
  });
});
