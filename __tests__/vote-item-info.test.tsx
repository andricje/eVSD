import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { User, VotableItem, VoteEvent, VoteOption } from '@/types/proposal';
import { STRINGS } from '@/constants/strings';
import { VoteItemInfo } from '@/components/VoteItemInfo/vote-item-info';
import {v4 as uuidv4} from 'uuid';
import { getTranslatedVoteOptionWithCount, QUORUM } from '@/lib/utils';

global.ResizeObserver = require('resize-observer-polyfill')

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
    expect(screen.getByText(getTranslatedVoteOptionWithCount("for",10))).toBeInTheDocument();
    expect(screen.getByText(getTranslatedVoteOptionWithCount("against",3))).toBeInTheDocument();
    expect(screen.getByText(getTranslatedVoteOptionWithCount("abstain",5))).toBeInTheDocument();
  });
  it("Shows quorum reached when there are enough votes", async () => {
    const quorumhalf = Math.floor(QUORUM/2);
    const voteItem = getVoteItem(quorumhalf,quorumhalf,5);
    render(<VoteItemInfo voteItem={voteItem} />);
    expect(screen.getByText(STRINGS.voting.quorumReached)).toBeInTheDocument();
  });
});
