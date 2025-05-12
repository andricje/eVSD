import {
  EvsdGovernor,
  EvsdGovernor__factory,
  EvsdToken,
  EvsdToken__factory,
  Announcements,
  Announcements__factory,
} from "../typechain-types";
import evsdGovernorArtifacts from "../contracts/evsd-governor.json";
import evsdTokenArtifacts from "../contracts/evsd-token.json";
import evsdAnnouncementsArtifacts from "../contracts/evsd-announcements.json";
import {
  Proposal,
  ProposalSerializationData,
  VoteOption,
} from "@/types/proposal";
import { Announcement } from "@/types/announcements";
import { BigNumberish, ethers, Signer } from "ethers";
import { convertAddressToName, governorVoteMap } from "./utils";
import { addressNameMap } from "./address-name-map";

export function getDeployedContracts(signer: Signer): {
  governor: EvsdGovernor;
  token: EvsdToken;
  announcements: Announcements;
} {
  const governor = EvsdGovernor__factory.connect(
    evsdGovernorArtifacts.address,
    signer
  );
  const token = EvsdToken__factory.connect(evsdTokenArtifacts.address, signer);
  const announcements = Announcements__factory.connect(
    evsdAnnouncementsArtifacts.address,
    signer
  );
  return { governor, token, announcements };
}

export async function createProposalDoNothing(
  proposer: Signer,
  governor: EvsdGovernor,
  proposalDescription: string,
  proposalTitle: string = "",
  isMultilayered: boolean = false,
  subItems: any[] = []
) {
  const serializedProposal = serializeProposal({
    title: proposalTitle,
    description: proposalDescription,
    isMultilayered,
    subItems: isMultilayered ? subItems : undefined,
  });
  console.log("Креирање предлога: " + serializedProposal);

  try {
    // Проверавамо стање токена
    const proposerAddress = await proposer.getAddress();
    const proposalThresholdValue = await governor.proposalThreshold();

    console.log(
      `Потребни токени за предлог: ${ethers.formatUnits(proposalThresholdValue, 18)}`
    );

    // Директно креирамо предлог (делегирање се већ обавља у UI компоненти)
    console.log("Креирање предлога...");
    governor = governor.connect(proposer);
    const governorAddress = await governor.getAddress();
    
    // Sada koristimo neku drugu funkciju umesto doNothing
    const emptyCalldata = governor.interface.encodeFunctionData("votingPeriod");

    const tx = await governor.propose(
      [governorAddress],
      [0],
      [emptyCalldata],
      serializedProposal
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
export async function castVote(
  voter: Signer,
  governor: EvsdGovernor,
  proposalId: BigNumberish,
  vote: BigNumberish
) {
  const governorContract = governor.connect(voter);
  await governorContract.castVote(proposalId, vote);
} /**
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
    console.log(
      `Симулирани трансфер ${amount} токена на адресу: ${await signer.getAddress()}`
    );

    // Пауза да симулирамо време трансакције
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Симулирани успешан резултат
    console.log("Токени су успешно пренети!");
    return true;
  } catch (error) {
    console.error("Грешка при трансферу токена:", error);
    return false;
  }
} /**
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
    console.log(
      `Симулирано слање ${amount} токена кориснику: ${await signer.getAddress()}`
    );
    return true;
  } catch (error) {
    console.error("Error minting test tokens:", error);
    return false;
  }
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

      // All serializable data is stored as a json string inside the proposal description
      const deserializedData = deserializeProposal(event.args.description);

      // Note that the code below removes decimals from the counted votes and therefore will not work properly if we allow decimal votes in the future
      const proposal: Proposal = {
        ...deserializedData,
        id: proposalId,
        dateAdded: voteStart,
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
export async function getVotesForProposal(
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

function serializeProposal(proposal: ProposalSerializationData): string {
  return JSON.stringify(proposal);
}

function deserializeProposal(
  proposalString: string
): ProposalSerializationData {
  return JSON.parse(proposalString) as ProposalSerializationData;
}

// Funkcija za dohvatanje aktivnih obraćanja
export async function getActiveAnnouncements(
  announcements: Announcements
): Promise<Announcement[]> {
  try {
    // Pozivamo funkciju iz ugovora za dobijanje aktivnih obraćanja
    const activeAnnouncementsList = await announcements.getActiveAnnouncements();
    
    // Mapiramo rezultate u naš tip Announcement
    const parsedAnnouncements = activeAnnouncementsList.map((announcement, index) => {
      // Generišemo jedinstveni ID koji sadrži adresu i timestamp za potpunu jedinstvenost
      const uniqueId = `${announcement.announcer.substring(0, 6)}-${announcement.timestamp}-${index}`;
      
      return {
        id: uniqueId, // Koristimo kompozitni ključ umesto rednog broja
        content: announcement.content,
        announcer: convertAddressToName(announcement.announcer),
        timestamp: Number(announcement.timestamp),
        isActive: announcement.isActive,
      };
    });
    
    return parsedAnnouncements;
  } catch (error) {
    console.error("Greška pri dohvatanju obraćanja:", error);
    return [];
  }
}

// Funkcija za kreiranje novog obraćanja (samo za vlasnike/administratore)
export async function createAnnouncement(
  signer: Signer,
  content: string
): Promise<string | null> {
  try {
    const { announcements } = getDeployedContracts(signer);
    const tx = await announcements.connect(signer).createAnnouncement(content);
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
  announcementId: string
): Promise<boolean> {
  try {
    const { announcements } = getDeployedContracts(signer);
    const tx = await announcements.connect(signer).deactivateAnnouncement(announcementId);
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
    // Ne filtriramo direktno po proposalId u filter pozivu jer nije indeksiran parametar
    const filter = governor.filters.ProposalCreated();
    const events = await governor.queryFilter(filter);
    
    // Filtriramo događaje u memoriji da pronađemo traženi proposal
    const matchingEvents = events.filter(event => 
      event.args.proposalId.toString() === proposalId.toString()
    );
    
    if (matchingEvents.length === 0) {
      throw new Error("Nije pronađen originalni događaj kreiranja predloga");
    }
    
    const event = matchingEvents[0];
    
    // Direktno koristimo parametre iz događaja bez pokušaja modifikacije
    const targets = event.args.targets;
    const values = event.args.values;
    const calldatas = event.args.calldatas;
    const description = event.args.description;
    
    // 2. Računamo hash opisa za cancel funkciju
    const descriptionHash = ethers.id(description);
    
    // 3. Pozivamo cancel funkciju sa svim potrebnim parametrima
    const governorContract = governor.connect(signer);
    console.log("Otkazivanje predloga - podaci:", {
      targets: typeof targets,
      values: typeof values,
      calldatas: typeof calldatas
    });
    
    // Direktno koristimo originalne parametre
    const tx = await governorContract.cancel(targets, values, calldatas, descriptionHash);
    await tx.wait();
    
    return true;
  } catch (error) {
    console.error("Greška pri otkazivanju predloga:", error);
    return false;
  }
}

// Alternativna funkcija za otkazivanje korisničkog predloga
export async function cancelProposalAlternative(
  signer: Signer,
  governor: EvsdGovernor,
  proposalId: BigNumberish
): Promise<boolean> {
  try {
    // 1. Pronalazimo originalni ProposalCreated događaj za ovaj proposalId
    const filter = governor.filters.ProposalCreated();
    const events = await governor.queryFilter(filter);
    
    // Filtriramo događaje u memoriji da pronađemo traženi proposal
    const matchingEvents = events.filter(event => 
      event.args.proposalId.toString() === proposalId.toString()
    );
    
    if (matchingEvents.length === 0) {
      throw new Error("Nije pronađen originalni događaj kreiranja predloga");
    }
    
    const event = matchingEvents[0];
    const description = event.args.description;
    
    // 2. Računamo hash opisa za cancel funkciju
    const descriptionHash = ethers.id(description);
    
    // 3. Rekonstruišemo podatke koji su prošli kroz propose funkciju
    // Za jednostavne predloge gde je samo jedna adresa u listi, koristimo ovu metodu
    const governorAddress = await governor.getAddress();
    const targets = [governorAddress];
    const values = [0]; // 0 ETH, promeniti ako je predlog koristio druge vrednosti
    const emptyCalldata = governor.interface.encodeFunctionData("votingPeriod");
    const calldatas = [emptyCalldata];
    
    // 4. Pozivamo cancel funkciju sa rekonstruisanim parametrima
    const governorContract = governor.connect(signer);
    console.log("Otkazivanje predloga (alternativno):", {
      targets,
      values,
      calldatas,
      descriptionHash
    });
    
    const tx = await governorContract.cancel(targets, values, calldatas, descriptionHash);
    await tx.wait();
    
    return true;
  } catch (error) {
    console.error("Greška pri otkazivanju predloga (alternativni način):", error);
    return false;
  }
}

// Nova funkcija za direktno otkazivanje predloga koristeći niži nivo pristupa
export async function cancelProposalDirect(
  signer: Signer,
  governor: EvsdGovernor,
  proposalId: BigNumberish
): Promise<boolean> {
  try {
    // 1. Pronalazimo originalni ProposalCreated događaj
    const filter = governor.filters.ProposalCreated();
    const events = await governor.queryFilter(filter);
    
    const matchingEvents = events.filter(event => 
      event.args.proposalId.toString() === proposalId.toString()
    );
    
    if (matchingEvents.length === 0) {
      throw new Error("Nije pronađen originalni događaj kreiranja predloga");
    }
    
    const event = matchingEvents[0];
    const description = event.args.description;
    const descriptionHash = ethers.id(description);
    
    // 2. Dobijamo adresu ugovora
    const governorAddress = await governor.getAddress();
    
    // 3. Direktno kodiramo poziv "cancel" funkcije sa potrebnim parametrima
    // cancel(address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash)
    
    // Za jednostavan predlog, koristimo samo jedan target (adresu ugovora)
    const targets = [governorAddress];
    const values = ["0"]; // Nikakva vrednost ETH-a se ne šalje
    
    // Koristimo jednostavan poziv votingPeriod kao placeholder
    const calldata = governor.interface.encodeFunctionData("votingPeriod");
    const calldatas = [calldata];
    
    // Funkcija cancel ima sledeći potpis:
    // function cancel(address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash)
    
    // Kodiramo poziv funkcije cancel sa našim parametrima
    const cancelData = governor.interface.encodeFunctionData("cancel", [
      targets,
      values,
      calldatas,
      descriptionHash
    ]);
    
    // Slanje transakcije
    const tx = await signer.sendTransaction({
      to: governorAddress,
      data: cancelData,
    });
    
    console.log("Direktna transakcija otkazivanja poslata:", tx.hash);
    await tx.wait();
    
    return true;
  } catch (error) {
    console.error("Greška pri direktnom otkazivanju predloga:", error);
    return false;
  }
}

// Funkcija za dohvatanje istorije glasanja konkretnog korisnika
export async function getUserVotingHistory(
  governor: EvsdGovernor,
  userAddress: string
): Promise<{
  proposalId: string;
  vote: VoteOption;
  timestamp: number;
}[]> {
  try {
    // Filteriramo događaje za glasanje korisnika, koristimo samo adresu korisnika
    // jer je voter indeksirani parametar u VoteCast događaju
    const filter = governor.filters.VoteCast(userAddress);
    const events = await governor.queryFilter(filter, 0, "latest");
    
    // Mapiramo događaje u format za istoriju glasanja
    const votingHistory = events.map((event) => {
      const vote = Number(event.args.support);
      return {
        proposalId: event.args.proposalId.toString(),
        vote: governorVoteMap[vote],
        timestamp: (event.args as any).timestamp || event.blockNumber?.toString() || 0,
      };
    });
    
    return votingHistory;
  } catch (error) {
    console.error("Greška pri dohvatanju istorije glasanja:", error);
    return [];
  }
}

// Funkcija za dohvatanje podataka o predlogu po ID-u
export async function getProposalById(
  governor: EvsdGovernor,
  token: EvsdToken,
  proposalId: string,
  userAddress: string
): Promise<Proposal | null> {
  try {
    // Dohvatamo sve događaje kreiranja predloga
    const filter = governor.filters.ProposalCreated();
    const events = await governor.queryFilter(filter, 0, "latest");
    
    // Tražimo događaj za naš proposalId
    const event = events.find(e => e.args.proposalId.toString() === proposalId);
    
    if (!event) {
      console.error("Predlog sa ID-om", proposalId, "nije pronađen");
      return null;
    }
    
    // Ako smo našli događaj, dohvatamo sve potrebne podatke
    const proposalState = await governor.state(proposalId);
    const countedVotes = await governor.proposalVotes(proposalId);
    const allVotes = await getVotesForProposal(governor, BigInt(proposalId));
    const deadline = await governor.proposalDeadline(proposalId);
    const closesAt = new Date(Number(deadline) * 1000);
    const voteStart = new Date(Number(event.args.voteStart) * 1000);
    const decimals = await token.decimals();
    const oneToken = ethers.parseUnits("1", decimals);
    
    // Deserijalizujemo podatke iz opisa predloga
    const deserializedData = deserializeProposal(event.args.description);
    
    const proposal: Proposal = {
      ...deserializedData,
      id: BigInt(proposalId),
      dateAdded: voteStart,
      author: convertAddressToName(event.args.proposer),
      votesFor: Number(countedVotes.forVotes / oneToken),
      votesAgainst: Number(countedVotes.againstVotes / oneToken),
      votesAbstain: Number(countedVotes.abstainVotes / oneToken),
      status: Number(proposalState) > 1 ? "closed" : "open",
      closesAt: closesAt,
      yourVote: userAddress.toLowerCase() in allVotes ? allVotes[userAddress.toLowerCase()] : "notEligible",
      votesForAddress: allVotes,
      canBeCanceled: Number(proposalState) === 0 || Number(proposalState) === 1, // Pending (0) ili Active (1)
    };
    
    return proposal;
  } catch (error) {
    console.error("Greška pri dohvatanju predloga:", error);
    return null;
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
    const events = await governor.queryFilter(proposalCreatedFilter, 0, "latest");
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
        const countedVotes = await governor.proposalVotes(event.args.proposalId);
        const allVotes = await getVotesForProposal(governor, proposalId);
        const yourVote =
          userAddress.toLowerCase() in allVotes ? allVotes[userAddress.toLowerCase()] : "notEligible";
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
          canBeCanceled: Number(proposalState) === 0 || Number(proposalState) === 1, // Pending (0) ili Active (1)
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

// Funkcija za proveru da li je korisnik owner ugovora
export async function isContractOwner(signer: Signer, governor: EvsdGovernor): Promise<boolean> {
  try {
    const signerAddress = await signer.getAddress();
    const ownerAddress = await governor.owner();
    return signerAddress.toLowerCase() === ownerAddress.toLowerCase();
  } catch (error) {
    console.error("Greška pri proveri vlasništva:", error);
    return false;
  }
}

// Funkcija za proveru da li korisnik ima pravo glasa
export async function hasVotingRights(signer: Signer, governor: EvsdGovernor): Promise<boolean> {
  try {
    const signerAddress = await signer.getAddress();
    return await governor.hasVotingRights(signerAddress);
  } catch (error) {
    console.error("Greška pri proveri prava glasa:", error);
    return false;
  }
}

// Funkcija za registrovanje nove adrese fakulteta
export async function registerNewVoter(
  signer: Signer,
  voterAddress: string
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    const { governor } = getDeployedContracts(signer);
    
    // Provera da li trenutni korisnik ima pravo glasa
    const hasRights = await hasVotingRights(signer, governor);
    
    if (!hasRights) {
      return { 
        success: false, 
        error: "Nemate dozvolu za registraciju novih adresa. Samo članovi sa pravom glasa mogu registrovati nove fakultete." 
      };
    }
    
    // Proveravamo da li adresa već ima pravo glasa
    const targetHasRights = await governor.hasVotingRights(voterAddress);
    if (targetHasRights) {
      return { 
        success: false, 
        error: "Ova adresa već ima pravo glasa." 
      };
    }
    
    try {
      // Pokušaj registracije direktno preko regularnog poziva
      console.log(`Registracija nove adrese fakulteta: ${voterAddress}`);
      const governorAddress = await governor.getAddress();
      
      // Direktno kodiramo poziv "registerVoter" funkcije
      const data = governor.interface.encodeFunctionData("registerVoter", [voterAddress]);
      
      // Šaljemo transakciju direktno
      const tx = await signer.sendTransaction({
        to: governorAddress,
        data: data
      });
      
      await tx.wait();
      
      return { 
        success: true, 
        txHash: tx.hash 
      };
    } catch (error) {
      console.error("Greška pri direktnoj registraciji:", error);
      // Ako direktan pristup ne uspe, prijavimo grešku
      return {
        success: false,
        error: "Greška pri registraciji nove adrese. Proverite da li imate dovoljno ETH za gas."
      };
    }
  } catch (error) {
    console.error("Greška pri registraciji nove adrese:", error);
    
    // Obrada specifičnih grešaka
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("execution reverted") || errorMessage.includes("CALL_EXCEPTION")) {
      return {
        success: false,
        error: "Greška pri registraciji. Proverite dozvole i pokušajte ponovo."
      };
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Nepoznata greška" 
    };
  }
}
