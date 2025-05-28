import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { PerFacultyVotes } from '@/components/VoteItemInfo/vote-item-info';
import { addressNameMap } from '@/constants/address-name-map';
import { getVoteItem } from '../test/dummy-objects';

global.ResizeObserver = require('resize-observer-polyfill')

describe('NewProposalDialog', () => {
  it("Shows all faculties that did cast a vote", async () => {
    const voteItem = getVoteItem(["for","against","abstain"]);
    render(<PerFacultyVotes voteItem={voteItem} />);
    const names = Object.values(addressNameMap);
    expect(screen.getByText(names[0])).toBeInTheDocument();
    expect(screen.getByText(names[1])).toBeInTheDocument();
    expect(screen.getByText(names[2])).toBeInTheDocument();
  });
});
