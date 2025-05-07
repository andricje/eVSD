import {
  EvsdGovernor,
  EvsdGovernor__factory,
  EvsdToken,
  EvsdToken__factory,
} from "../typechain-types";
import { clsx, type ClassValue } from "clsx";
import { BigNumberish, ethers, Signer } from "ethers";
import { twMerge } from "tailwind-merge";
import evsdGovernorArtifacts from "../contracts/evsd-governor.json";
import evsdTokenArtifacts from "../contracts/evsd-token.json";
import { Proposal, VoteOption, VoteResult } from "../types/proposal";
import { addressNameMap } from "./address-name-map";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const governorVoteMap: Record<number, VoteOption> = {
  0: "against",
  1: "for",
  2: "abstain",
};

const inverseGovernorVoteMap: Record<VoteOption, bigint> = {
  notEligible: BigInt(-1),
  didntVote: BigInt(-1),
  against: BigInt(0),
  for: BigInt(1),
  abstain: BigInt(2),
};

export function convertVoteOptionToGovernor(vote: VoteOption): bigint {
  if (vote === "didntVote") {
    throw new Error("didntVote can't be converted to a governor vote");
  }
  return inverseGovernorVoteMap[vote];
}

export function convertGovernorToVoteOption(vote: bigint): VoteOption {
  const voteNumber = Number(vote);
  if (voteNumber in governorVoteMap) {
    return governorVoteMap[voteNumber];
  }
  throw new Error("Invalid vote option");
}

export function convertAddressToName(address: string): string {
  return address in addressNameMap
    ? (addressNameMap[address] as string)
    : "Nepoznato";
}

export function convertVoteOptionToString(vote: VoteOption): string {
  const voteOptionMap: Record<VoteOption, string> = {
    for: "за",
    against: "против",
    abstain: "уздржан",
    didntVote: "нисте гласали",
    notEligible: "немате право гласа",
  };
  return voteOptionMap[vote];
}

export const QUORUM = 20;

export function getVoteResult(
  votesFor: number,
  votesAgainst: number,
  votesAbstain: number
): VoteResult {
  const totalVotes = votesFor + votesAgainst + votesAbstain;
  if (totalVotes >= QUORUM) {
    if (votesFor > votesAgainst) {
      return "passed";
    } else {
      return "failed";
    }
  } else {
    return "returned";
  }
}

async function getVotesForProposal(
  governor: EvsdGovernor,
  proposalId: bigint
): Promise<Record<string, VoteOption>> {
  const votes: Record<string, VoteOption> = {};
  const filter = governor.filters.VoteCast();
  const events = await governor.queryFilter(filter);
  const eventsForProposal = events.filter(
    (event) => event.args.proposalId === proposalId
  );
  for (const address of Object.keys(addressNameMap)) {
    const eventsForAddress = eventsForProposal.filter(
      (event) => event.args.voter === address
    );
    if (eventsForAddress.length == 0) {
      votes[address] = "didntVote";
    } else {
      const vote = Number(eventsForAddress[0].args.support);
      votes[address] = governorVoteMap[vote];
    }
  }
  return votes;
}

export async function getProposals(
  governor: EvsdGovernor,
  token: EvsdToken,
  signer: Signer
): Promise<Proposal[]> {
  const proposalCreatedFilter = governor.filters.ProposalCreated();
  const events = await governor.queryFilter(proposalCreatedFilter, 0, "latest");
  const signerAddress = await signer.getAddress();
  const decimals = await token.decimals();
  const oneToken = ethers.parseUnits("1", decimals);

  const results = await Promise.all(
    events.map(async (event) => {
      const proposalId = event.args.proposalId;
      const proposalState = await governor.state(proposalId);
      const countedVotes = await governor.proposalVotes(event.args.proposalId);
      const allVotes = await getVotesForProposal(governor, proposalId);
      const yourVote =
        signerAddress in allVotes ? allVotes[signerAddress] : "notEligible";
      const deadline = await governor.proposalDeadline(proposalId);
      const closesAt = new Date(Number(deadline) * 1000);
      const voteStart = new Date(Number(event.args.voteStart) * 1000);

      // Извлачимо наслов из описа ако је у правилном формату
      let title = "Предлог за гласање";
      let description = event.args.description;
      
      // Проверавамо да ли опис садржи наслов у формату "НАСЛОВ:наслов|опис"
      if (description.startsWith("НАСЛОВ:")) {
        const parts = description.substring(7).split("|", 2);
        if (parts.length === 2) {
          title = parts[0];
          description = parts[1];
        }
      }

      // Note that the code below removes decimals from the counted votes and therefore will not work properly if we allow decimal votes in the future
      const proposal: Proposal = {
        id: proposalId,
        title: title,
        dateAdded: voteStart,
        description: description,
        author: convertAddressToName(event.args.proposer),
        votesFor: Number(countedVotes.forVotes / oneToken),
        votesAgainst: Number(countedVotes.againstVotes / oneToken),
        votesAbstain: Number(countedVotes.abstainVotes / oneToken),
        status: "open",
        closesAt: closesAt,
        yourVote: yourVote,
        votesForAddress: allVotes,
      };
      return proposal;
    })
  );
  return results;
}
export function getDeployedContracts(signer: Signer): {
  governor: EvsdGovernor;
  token: EvsdToken;
} {
  // Ажуриране адресе након поновног деплојмента
  const GOVERNOR_ADDRESS = "0x322813Fd9A801c5507c9de605d63CEA4f2CE6c44";
  const TOKEN_ADDRESS = "0x4ed7c70F96B99c776995fB64377f0d4aB3B0e1C1";
  
  const governor = EvsdGovernor__factory.connect(
    GOVERNOR_ADDRESS,
    signer
  );
  const token = EvsdToken__factory.connect(TOKEN_ADDRESS, signer);
  return { governor, token };
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
    return "Isteklo";
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
  return proposal.status === "closed";
};

export function isQuorumReached(proposal: Proposal) {
  return countTotalVotes(proposal) > QUORUM;
}

export function countTotalVotes(proposal: Proposal) {
  return proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain;
}
export async function createProposalDoNothing(
  proposer: Signer,
  governor: EvsdGovernor,
  proposalDescription: string,
  proposalTitle: string = ""
) {
  // Форматирамо опис да укључује и наслов
  const formattedDescription = proposalTitle 
    ? `НАСЛОВ:${proposalTitle}|${proposalDescription}` 
    : proposalDescription;
  
  console.log("Креирање предлога: " + formattedDescription);
  
  try {
    // Проверавамо стање токена
    const proposerAddress = await proposer.getAddress();
    const proposalThresholdValue = await governor.proposalThreshold();
    
    console.log(`Потребни токени за предлог: ${ethers.formatUnits(proposalThresholdValue, 18)}`);
    
    // Директно креирамо предлог (делегирање се већ обавља у UI компоненти)
    console.log("Креирање предлога...");
    governor = governor.connect(proposer);
    const governorAddress = await governor.getAddress();
    const doNothingCalldata = governor.interface.encodeFunctionData("doNothing");
    
    // Слање трансакције за креирање предлога
    const tx = await governor.propose(
      [governorAddress],
      [0],
      [doNothingCalldata],
      formattedDescription
    );
    
    console.log("Трансакција послата:", tx.hash);
    await tx.wait(1); // Чекамо да се трансакција потврди
    console.log("Предлог успешно креиран");
    return tx.hash;
  } catch (error) {
    console.error("Грешка при креирању предлога:", error);
    throw error;
  }
}

/**
 * Функција за симулацију слања токена кориснику за потребе тестирања
 * У правој имплементацији ово би био позив на бекенд или фаукет
 */
export async function mintTestTokens(
  signer: Signer,
  amount: string = "1.0" 
): Promise<boolean> {
  try {
    // Овде бисмо имали стварну имплементацију за пренос токена
    // За сад само симулирамо успех
    console.log(`Симулирано слање ${amount} токена кориснику: ${await signer.getAddress()}`);
    return true;
  } catch (error) {
    console.error("Error minting test tokens:", error);
    return false;
  }
}

export async function castVote(
  voter: Signer,
  governor: EvsdGovernor,
  proposalId: BigNumberish,
  vote: BigNumberish
) {
  const governorContract = governor.connect(voter);
  await governorContract.castVote(proposalId, vote);
}

export function tryParseAsBigInt(value: string): bigint | undefined {
  try {
    return BigInt(value);
  } catch {
    return undefined;
  }
}

/**
 * Помоћна функција за пребацивање токена од админ адресе до предлагача.
 * У правој имплементацији ово би био део бекенд сервиса или фаукет уговора.
 * Сам уговор има токене, али овде симулирамо пренос токена са адресе која их већ има.
 */
export async function transferTokensForProposal(
  signer: Signer,
  amount: string = "1.0"
): Promise<boolean> {
  try {
    // Симулирамо успешан трансфер токена
    console.log(`Симулирани трансфер ${amount} токена на адресу: ${await signer.getAddress()}`);
    
    // Пауза да симулирамо време трансакције
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Симулирани успешан резултат
    console.log("Токени су успешно пренети!");
    return true;
  } catch (error) {
    console.error("Грешка при трансферу токена:", error);
    return false;
  }
}
