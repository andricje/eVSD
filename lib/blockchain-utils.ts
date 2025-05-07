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
  ProposalSerializationData,
  VoteOption,
} from "@/types/proposal";
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

export async function createProposalDoNothing(
  proposer: Signer,
  governor: EvsdGovernor,
  proposalDescription: string,
  proposalTitle: string = ""
) {
  const serializedProposal = serializeProposal({
    title: proposalTitle,
    description: proposalDescription,
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
    const doNothingCalldata =
      governor.interface.encodeFunctionData("doNothing");

    const tx = await governor.propose(
      [governorAddress],
      [0],
      [doNothingCalldata],
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
