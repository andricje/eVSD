import {
  EvsdGovernor,
  EvsdGovernor__factory,
  EvsdToken,
  EvsdToken__factory,
} from "../typechain-types";
import evsdGovernorArtifacts from "../contracts/evsd-governor.json";
import evsdTokenArtifacts from "../contracts/evsd-token.json";
import {
  Proposal,
  VotableItemSerializationData,
  VoteOption,
} from "@/types/proposal";
import { Announcement } from "@/types/announcements";
import { BigNumberish, ethers, Signer } from "ethers";
import { convertAddressToName, governorVoteMap } from "./utils";
import { addressNameMap } from "./address-name-map";

export function getDeployedContracts(signer: Signer): {
  governor: EvsdGovernor;
  token: EvsdToken;
} {
  const governor = EvsdGovernor__factory.connect(
    evsdGovernorArtifacts.address,
    signer
  );
  const token = EvsdToken__factory.connect(evsdTokenArtifacts.address, signer);
  return { governor, token };
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

function serializeProposal(proposal: VotableItemSerializationData): string {
  return JSON.stringify(proposal);
}

function deserializeProposal(
  proposalString: string
): VotableItemSerializationData {
  return JSON.parse(proposalString) as VotableItemSerializationData;
}

// Funkcija za dohvatanje aktivnih obraćanja
export async function getActiveAnnouncements(
  governor: EvsdGovernor
): Promise<Announcement[]> {
  try {
    // Filteriramo događaje za kreirana obraćanja
    const createdFilter = governor.filters.AnnouncementCreated();
    const createdEvents = await governor.queryFilter(
      createdFilter,
      0,
      "latest"
    );

    // Filteriramo događaje za deaktivirana obraćanja
    const deactivatedFilter = governor.filters.AnnouncementDeactivated();
    const deactivatedEvents = await governor.queryFilter(
      deactivatedFilter,
      0,
      "latest"
    );

    // Kreiramo set ID-jeva deaktiviranih obraćanja za brzu proveru
    const deactivatedIds = new Set(
      deactivatedEvents.map((event) => event.args.announcementId.toString())
    );

    // Mapiramo kreirana obraćanja u niz, isključujući ona koja su deaktivirana
    const announcements = createdEvents
      .map((event) => {
        const id = event.args.announcementId.toString();
        if (deactivatedIds.has(id)) {
          return null;
        } // Preskačemo deaktivirana obraćanja

        return {
          id: id,
          content: event.args.content,
          announcer: convertAddressToName(event.args.announcer),
          timestamp: Number(event.args.timestamp),
          isActive: true,
        };
      })
      .filter(
        (announcement): announcement is Announcement => announcement !== null
      );

    return announcements;
  } catch (error) {
    console.error("Greška pri dohvatanju obraćanja:", error);
    return [];
  }
}

// Funkcija za kreiranje novog obraćanja (samo za vlasnike/administratore)
export async function createAnnouncement(
  signer: Signer,
  governor: EvsdGovernor,
  content: string
): Promise<string | null> {
  try {
    const tx = await governor.connect(signer).createAnnouncement(content);
    await tx.wait();
    return tx.hash;
  } catch (error) {
    console.error("Greška pri kreiranju obraćanja:", error);
    return null;
  }
}

// Funkcija za deaktiviranje obraćanja
export async function deactivateAnnouncement(
  signer: Signer,
  governor: EvsdGovernor,
  announcementId: string
): Promise<boolean> {
  try {
    const tx = await governor
      .connect(signer)
      .deactivateAnnouncement(announcementId);
    await tx.wait();
    return true;
  } catch (error) {
    console.error("Greška pri deaktiviranju obraćanja:", error);
    return false;
  }
}

// Funkcija za otkazivanje korisničkog predloga
export async function cancelProposal(
  signer: Signer,
  governor: EvsdGovernor,
  proposalId: BigNumberish
): Promise<boolean> {
  try {
    // Da bismo otkazali predlog u OpenZeppelin Governor-u, moramo dobiti originalne podatke predloga
    // iz ProposalCreated događaja, jer cancel funkcija zahteva te podatke

    // 1. Pronalazimo originalni ProposalCreated događaj za ovaj proposalId
    const filter = governor.filters.ProposalCreated(proposalId);
    const events = await governor.queryFilter(filter);

    if (events.length === 0) {
      throw new Error("Nije pronađen originalni događaj kreiranja predloga");
    }

    const event = events[0];
    const { targets, values, calldatas, description } = event.args;

    // 2. Računamo hash opisa za cancel funkciju
    const descriptionHash = ethers.id(description);

    // 3. Pozivamo cancel funkciju sa svim potrebnim parametrima
    const governorContract = governor.connect(signer);
    const tx = await governorContract.cancel(
      targets,
      values,
      calldatas,
      descriptionHash
    );
    await tx.wait();

    return true;
  } catch (error) {
    console.error("Greška pri otkazivanju predloga:", error);
    return false;
  }
}

// Funkcija za dohvatanje istorije glasanja konkretnog korisnika
export async function getUserVotingHistory(
  governor: EvsdGovernor,
  userAddress: string
): Promise<
  {
    proposalId: string;
    vote: VoteOption;
    timestamp: number;
  }[]
> {
  try {
    // Filteriramo događaje za glasanje korisnika
    const filter = governor.filters.VoteCast(userAddress);
    const events = await governor.queryFilter(filter, 0, "latest");

    // Mapiramo događaje u format za istoriju glasanja
    const votingHistory = events.map((event) => {
      const vote = Number(event.args.support);
      return {
        proposalId: event.args.proposalId.toString(),
        vote: governorVoteMap[vote],
        timestamp:
          (event.args as any).timestamp || event.blockNumber?.toString() || 0,
      };
    });

    return votingHistory;
  } catch (error) {
    console.error("Greška pri dohvatanju istorije glasanja:", error);
    return [];
  }
}

// Funkcija za dohvatanje predloga koje je kreirao korisnik
export async function getUserProposals(
  governor: EvsdGovernor,
  token: EvsdToken,
  userAddress: string,
  signer: Signer
): Promise<Proposal[]> {
  try {
    const proposalCreatedFilter = governor.filters.ProposalCreated();
    const events = await governor.queryFilter(
      proposalCreatedFilter,
      0,
      "latest"
    );
    const decimals = await token.decimals();
    const oneToken = ethers.parseUnits("1", decimals);

    // Filtriramo samo predloge koje je kreirao korisnik
    const userEvents = events.filter(
      (event) => event.args.proposer.toLowerCase() === userAddress.toLowerCase()
    );

    const results = await Promise.all(
      userEvents.map(async (event) => {
        const proposalId = event.args.proposalId;
        const proposalState = await governor.state(proposalId);
        const countedVotes = await governor.proposalVotes(
          event.args.proposalId
        );
        const allVotes = await getVotesForProposal(governor, proposalId);
        const yourVote =
          userAddress.toLowerCase() in allVotes
            ? allVotes[userAddress.toLowerCase()]
            : "notEligible";
        const deadline = await governor.proposalDeadline(proposalId);
        const closesAt = new Date(Number(deadline) * 1000);
        const voteStart = new Date(Number(event.args.voteStart) * 1000);

        const deserializedData = deserializeProposal(event.args.description);

        const proposal: Proposal = {
          ...deserializedData,
          id: proposalId,
          dateAdded: voteStart,
          author: convertAddressToName(event.args.proposer),
          votesFor: Number(countedVotes.forVotes / oneToken),
          votesAgainst: Number(countedVotes.againstVotes / oneToken),
          votesAbstain: Number(countedVotes.abstainVotes / oneToken),
          status: "open", // Ovo će biti zamenjeno na osnovu proposalState u UI
          closesAt: closesAt,
          yourVote: yourVote,
          votesForAddress: allVotes,
          canBeCanceled:
            Number(proposalState) === 0 || Number(proposalState) === 1, // Pending (0) ili Active (1)
        };
        return proposal;
      })
    );
    return results;
  } catch (error) {
    console.error("Greška pri dohvatanju korisničkih predloga:", error);
    return [];
  }
}
