import {
  User,
  VoteEvent,
  VotableItem,
  Proposal,
  VoteOption,
} from "../types/proposal";
import { createHash } from "crypto";

function generateEthAddress(seed: string) {
  const hash = createHash("sha256").update(seed).digest("hex");
  return "0x" + hash.slice(-40);
}

export function getDummyVoters(voterCount: number) {
  const voters: User[] = [];
  for (let i = 0; i < voterCount; i++) {
    const user: User = {
      address: generateEthAddress(`${i}`),
      name: `Test fakultet ${i}`,
    };
    voters.push(user);
  }
  return voters;
}

export function getVoteItem(votes: VoteOption[], voters: User[]) {
  const addressVoteMap = new Map<string, VoteEvent>();
  for (let i = 0; i < votes.length; i++) {
    const user = voters[i];
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
  const voters = getDummyVoters(10);
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
      getVoteItem(["for", "against", "abstain"], voters),
      getVoteItem(["for", "for", "against", "against"], voters),
    ],
  };
  return proposal;
}
