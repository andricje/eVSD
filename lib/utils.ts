import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  countVoteForOption,
  Proposal,
  ProposalState,
  ProposalStateMap,
  UIProposal,
  User,
  VotableItem,
  VoteEvent,
  VoteOption,
  VoteResult,
} from "../types/proposal";
import { STRINGS } from "../constants/strings";
import { EvsdToken } from "@/typechain-types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const governorVoteMap: Record<number, VoteOption> = {
  0: "against",
  1: "for",
  2: "abstain",
};

const inverseGovernorVoteMap: Record<VoteOption, bigint> = {
  against: BigInt(0),
  for: BigInt(1),
  abstain: BigInt(2),
};

export function convertVoteOptionToGovernor(vote: VoteOption): bigint {
  return inverseGovernorVoteMap[vote];
}

export function convertGovernorState(stateId: number): ProposalState {
  const stateString = ProposalStateMap.get(stateId);
  if (stateString === "Active" || stateString === "Pending") {
    return "open";
  } else if (stateString === "Canceled") {
    return "cancelled";
  } else if (
    stateString === "Defeated" ||
    stateString === "Succeeded" ||
    stateString === "Queued" ||
    stateString === "Expired" ||
    stateString === "Executed"
  ) {
    return "closed";
  } else {
    throw new Error("Invalid proposal state id");
  }
}

export function convertGovernorToVoteOption(vote: bigint): VoteOption {
  const voteNumber = Number(vote);
  if (voteNumber in governorVoteMap) {
    return governorVoteMap[voteNumber];
  }
  throw new Error("Invalid vote option");
}

export function convertVoteOptionToString(vote: VoteOption): string {
  const voteOptionMap: Record<VoteOption, string> = {
    for: "за",
    against: "против",
    abstain: "уздржан",
  };
  return voteOptionMap[vote];
}

export function getVoteResult(
  votesFor: number,
  votesAgainst: number,
  votesAbstain: number,
  quorum: number
): VoteResult {
  const totalVotes = votesFor + votesAgainst + votesAbstain;

  if (totalVotes < quorum) {
    return "no-quorum";
  } else if (votesFor > votesAgainst) {
    return "passed";
  } else {
    return "failed";
  }
}

export function getVoteResultForItem(voteItem: VotableItem, quorum: number) {
  const votesFor = countVoteForOption(voteItem, "for");
  const votesAgainst = countVoteForOption(voteItem, "against");
  const votesAbstain = countVoteForOption(voteItem, "abstain");
  return getVoteResult(votesFor, votesAgainst, votesAbstain, quorum);
}

// Formatiranje datuma
export const formatDateString = (dateString: string) => {
  const date = new Date(dateString);
  return formatDate(date);
};

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("sr-RS", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export const getRemainingTime = (expiresAt: Date) => {
  const now = new Date();
  const diffMs = expiresAt.getTime() - now.getTime();

  if (diffMs <= 0) {
    return null;
  }

  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return `${diffHrs}h ${diffMins}m`;
};
// Funkcija koja proverava da li je vreme za glasanje isteklo
export const hasVotingTimeExpired = (proposal: Proposal) => {
  const now = new Date();
  const expirationDate = new Date(proposal.closesAt);

  return now > expirationDate;
};
// Funkcija koja proverava da li je glasanje završeno
export const isVotingComplete = (proposal: Proposal) => {
  return proposal.status != "open";
};

export function isQuorumReached(voteItem: VotableItem, quorum: number) {
  return countTotalVotes(voteItem) > quorum;
}

export function isQuorumReachedForAllPoints(
  proposal: Proposal,
  quorum: number
) {
  return proposal.voteItems.every((item) => isQuorumReached(item, quorum));
}

export function countTotalVotes(voteItem: VotableItem) {
  return (
    countVoteForOption(voteItem, "for") +
    countVoteForOption(voteItem, "against") +
    countVoteForOption(voteItem, "abstain")
  );
}
export function tryParseAsBigInt(value: string): bigint | undefined {
  try {
    return BigInt(value);
  } catch {
    return undefined;
  }
}
export function getUserVotingHistory(proposals: Proposal[], user: User) {
  return proposals.reduce<{ event: VoteEvent; item: VotableItem }[]>(
    (acc, proposal) => {
      const votesForProposal = proposal.voteItems.reduce<
        { event: VoteEvent; item: VotableItem }[]
      >((acc, item) => {
        const userVote = item.userVotes.get(user.address);
        if (userVote) {
          acc.push({ event: userVote, item });
        }
        return acc;
      }, []);
      return acc.concat(votesForProposal);
    },
    []
  );
}

export function countUserRemainingItemsToVote(proposal: Proposal, user: User) {
  return proposal.voteItems.filter(
    (voteItem) => !voteItem.userVotes.has(user.address)
  ).length;
}

// Returns the hardcoded description for proposals that actually move tokens on chain and add new voters
// Always ignore the description on chain as it may be deceptive instead always use this one and read the address from the proposal calldata!
export function getNewVoterProposalDescription(
  newVoterAddress: string,
  newVoterName: string
) {
  return {
    title: `Додавање ${newVoterName} као новог члана Е-ВСД`,
    description: `Ово је предлог за додавање новог члана у састав Е-ВСД. Адреса члана је: ${newVoterAddress}. Члан ће бити додат под именом: ${newVoterName}`,
  };
}

export function getTranslatedVoteOption(voteOption: VoteOption) {
  switch (voteOption) {
    case "for":
      return STRINGS.voting.voteOptions.for;
    case "against":
      return STRINGS.voting.voteOptions.against;
    case "abstain":
      return STRINGS.voting.voteOptions.abstain;
  }
}

export function getTranslatedVoteOptionWithCount(
  voteOption: VoteOption,
  count: number
) {
  return `${getTranslatedVoteOption(voteOption)}: ${count}`;
}

async function areFilesEqual(file1?: File, file2?: File): Promise<boolean> {
  if (file1 === undefined && file2 === undefined) {
    return true;
  }
  if (file1 && file2) {
    // Try some early outs
    if (file1.size !== file2.size) {
      return false;
    }
    if (file1.name === file2.name && file1 === file2) {
      return true;
    }

    // Read and compare buffers byte by byte
    const [buffer1, buffer2] = await Promise.all([
      file1.arrayBuffer(),
      file2.arrayBuffer(),
    ]);
    const view1 = new Uint8Array(buffer1);
    const view2 = new Uint8Array(buffer2);
    for (let i = 0; i < view1.length; i++) {
      if (view1[i] !== view2[i]) {
        return false;
      }
    }

    return true;
  }
  return false;
}

export async function areProposalsEqual(
  uiProposal: UIProposal,
  proposal: Proposal
) {
  return (
    proposal.title === uiProposal.title &&
    proposal.description === uiProposal.description &&
    (await areFilesEqual(proposal.file, uiProposal.file))
  );
}

export async function getMintTokenCalldata(
  token: EvsdToken,
  newVoterAddress: string
) {
  const mintCalldata = token.interface.encodeFunctionData("mint", [
    newVoterAddress,
    1,
  ]);
  return mintCalldata;
}

export function clipAddress(address: string): string {
  if (address.length <= 10) {
    return address;
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function usersFromAddressNameMapRecord(
  record: Record<string, string>
): User[] {
  return Object.entries(record).map(([address, name]) => ({
    address,
    name,
  }));
}

export function getQuorumVotesText(quorum: number): string {
  let quorumText = "глас";

  if (quorum % 10 === 1) {
    if (quorum % 100 === 11) {
      quorumText += "ова";
    }
  } else if (quorum % 10 >= 2 && quorum % 10 <= 4) {
    if (quorum % 100 === 12 || quorum % 100 === 13 || quorum % 100 === 14) {
      quorumText += "ова";
    } else {
      quorumText += "а";
    }
  } else {
    quorumText += "ова";
  }

  return quorumText;
}
