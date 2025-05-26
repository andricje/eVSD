import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { Proposal, User, VotableItem, VoteEvent, VoteOption } from '@/types/proposal';
import { STRINGS } from '@/constants/strings';
import { ProposalCard } from '@/components/ProposalCard/proposal-card';
import { VoteItemInfo } from '@/components/VoteItemInfo/vote-item-info';
import {v4 as uuidv4} from 'uuid';

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

function generateUserVote(voteOption: VoteOption)
{
    const user : User = {
        address: uuidv4(),
        name: uuidv4()
    };
    const evt : VoteEvent = {
        vote: voteOption,
        date: new Date(),
        voter: user
    };
    return {address: user.address, event: evt};
}

function getVoteItem(votesFor: number, votesAgainst: number, votesAbstain: number)
{
    const votes = new Map<string, VoteEvent>();
    for(let i = 0; i < votesFor; i++)
    {
        const {address, event} = generateUserVote("for");
        votes.set(address, event);
    }
    for(let i = 0; i < votesAbstain; i++)
    {
        const {address, event} = generateUserVote("abstain");
        votes.set(address, event);
    }
    for(let i = 0; i < votesAgainst; i++)
    {
        const {address, event} = generateUserVote("against");
        votes.set(address, event);
    }
    const voteItem : VotableItem = {
        id: 123456n,
        title: 'Test votable item',
        description: 'Description',
        userVotes: votes
    };
    return voteItem;
}

describe('NewProposalDialog', () => {
  it("Shows the correct number of votes", async () => {
    const voteItem = getVoteItem(10,3,5);
    render(<VoteItemInfo voteItem={voteItem} />);
    
  });
});
