import {
  User,
  VoteEvent,
  VotableItem,
  Proposal,
  VoteOption,
} from "../types/proposal";
import { Wallet } from "ethers";

export function getVoteItem(votes: VoteOption[]) {
  const addressVoteMap = new Map<string, VoteEvent>();
  for (let i = 0; i < votes.length; i++) {
    const wallet = Wallet.createRandom();
    const user: User = {
      address: wallet.address,
      name: `Test fakultet ${i}`,
    };
    addressVoteMap.set(user.address, {
      vote: "for",
      date: new Date(),
      voter: user,
    });
  }

  const voteItem: VotableItem = {
    id: 123456n,
    title: "Test votable item",
    description: "Description",
    userVotes: addressVoteMap,
  };
  return voteItem;
}

export function getTestProposal(status: "open" | "closed" | "cancelled") {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const proposal: Proposal = {
    id: 0n,
    title: "Test proposal",
    description: "Test proposal description",
    author: {
      address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      name: "Fakultet 1",
    },
    dateAdded: today,
    status,
    closesAt: tomorrow,
    voteItems: [
      getVoteItem(["for", "against", "abstain"]),
      getVoteItem(["for", "for", "against", "against"]),
    ],
  };
  return proposal;
}
