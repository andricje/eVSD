import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { EvsdGovernor, EvsdGovernor__factory, EvsdToken__factory } from "../typechain-types";
import governorArtifacts from "../contracts/evsd-governor.json";
import tokenArtifacts from "../contracts/evsd-token.json";

// Funkcija za serijalizaciju predloga
function serializeProposal(proposal: {
  title: string;
  description: string;
  isMultilayered?: boolean;
  subItems?: any[];
}): string {
  return JSON.stringify(proposal);
}

// Funkcija za kreiranje testnog predloga
async function createTestProposal(governor: EvsdGovernor, proposer: HardhatEthersSigner) {
  console.log(" Креирање тестног предлога...");
  
  const proposalData = {
    title: "Тестни предлог за отказивање",
    description: "Ово је тестни предлог који ће бити отказан за демонстрацију функционалности.",
    isMultilayered: false
  };
  
  const serializedProposal = serializeProposal(proposalData);
  console.log("Садржај предлога:", serializedProposal);
  
  // Повезивање уговора са предлагачем
  const connectedGovernor = governor.connect(proposer);
  const governorAddress = await governor.getAddress();
  
  // Празан позив функције (користимо votingPeriod као функцију која не мења стање)
  const emptyCalldata = governor.interface.encodeFunctionData("votingPeriod");
  
  try {
    // Креирамо предлог
    console.log("Слање трансакције...");
    const tx = await connectedGovernor.propose(
      [governorAddress],
      [0],
      [emptyCalldata],
      serializedProposal
    );
    
    console.log("Трансакција послата:", tx.hash);
    const receipt = await tx.wait(1);
    
    // Извлачимо proposalId из догађаја
    const proposalCreatedEvent = receipt?.logs.find(
      (log: any) => log.topics[0] === connectedGovernor.interface.getEvent("ProposalCreated").topicHash
    );
    
    if (!proposalCreatedEvent) {
      throw new Error("Догађај ProposalCreated није пронађен у логовима трансакције");
    }
    
    const parsedEvent = connectedGovernor.interface.parseLog({
      topics: proposalCreatedEvent.topics as string[],
      data: proposalCreatedEvent.data
    });
    
    const proposalId = parsedEvent?.args.proposalId;
    console.log(" Предлог успешно креиран са ID-ом:", proposalId.toString());
    
    return proposalId;
  } catch (error) {
    console.error(" Грешка при креирању предлога:", error);
    return null;
  }
}

// Функција за отказивање предлога
async function cancelProposal(governor: EvsdGovernor, proposer: HardhatEthersSigner, proposalId: bigint) {
  console.log(`\n🗑️ Отказивање предлога са ID-ом: ${proposalId.toString()}`);
  
  try {
    // Прво морамо добити оригиналне податке предлога
    const filter = governor.filters.ProposalCreated();
    const events = await governor.queryFilter(filter);
    
    // Филтрирамо догађаје у меморији да пронађемо тражени предлог
    const matchingEvent = events.find((event: any) => 
      event.args.proposalId.toString() === proposalId.toString()
    );
    
    if (!matchingEvent) {
      throw new Error("Није пронађен оригинални догађај креирања предлога");
    }
    
    const { targets, values, calldatas, description } = matchingEvent.args;
    
    // Рачунамо hash описа за cancel функцију
    const descriptionHash = ethers.id(description);
    
    // Повезујемо уговор са предлагачем и позивамо cancel функцију
    const connectedGovernor = governor.connect(proposer);
    console.log("Слање трансакције за отказивање...");
    const tx = await connectedGovernor.cancel(targets, values, calldatas, descriptionHash);
    
    console.log("Трансакција послата:", tx.hash);
    await tx.wait(1);
    
    // Проверавамо стање предлога након отказивања
    const proposalState = await governor.state(proposalId);
    console.log(`Ново стање предлога: ${proposalState.toString()}`);
    
    if (proposalState.toString() === "2") { // 2 = Canceled
      console.log(" Предлог је успешно отказан!");
      return true;
    } else {
      console.log(" Предлог није отказан, стање:", proposalState.toString());
      return false;
    }
  } catch (error) {
    console.error("Грешка при отказивању предлога:", error);
    return false;
  }
}

async function main() {
  // Добијамо потписнике
  const [deployer] = await ethers.getSigners();
  
  // Повезујемо се са уговорима
  console.log("Повезивање са уговорима...");
  const governor = EvsdGovernor__factory.connect(governorArtifacts.address, deployer);
  const token = EvsdToken__factory.connect(tokenArtifacts.address, deployer);
  
  console.log("Повезани налог:", await deployer.getAddress());
  
  // Опције командне линије
  const args = process.argv.slice(2);
  const command = args[0] || "full-test"; // Подразумевано изводимо комплетан тест
  
  if (command === "create") {
    // Само креирамо предлог
    await createTestProposal(governor, deployer);
    return;
  }
  
  if (command === "cancel") {
    const proposalIdStr = args[1];
    if (!proposalIdStr) {
      console.error(" Мора се навести ID предлога за отказивање!");
      console.log("Пример: npx hardhat run scripts/test-proposal-cancel.ts cancel 123456789");
      return;
    }
    
    try {
      const proposalId = BigInt(proposalIdStr);
      await cancelProposal(governor, deployer, proposalId);
    } catch (error) {
      console.error(" Неисправан ID предлога!");
    }
    return;
  }
  
  if (command === "full-test") {
    // Креирамо тестни предлог и одмах га отказујемо
    console.log(" Покрећемо комплетан тест креирања и отказивања предлога...");
    
    // Креирамо предлог
    const proposalId = await createTestProposal(governor, deployer);
    
    if (!proposalId) {
      console.error(" Тест није успео - неуспешно креирање предлога.");
      return;
    }
    
    // Сачекајмо мало пре отказивања
    console.log("Сачекајте тренутак пре отказивања...");
    await new Promise(r => setTimeout(r, 2000));
    
    // Отказујемо предлог
    const cancelSuccess = await cancelProposal(governor, deployer, proposalId);
    
    if (cancelSuccess) {
      console.log(" Тест је успешно завршен - предлог је креиран и отказан!");
    } else {
      console.error(" Тест није успео - неуспешно отказивање предлога.");
    }
    return;
  }
  
  console.error(` Непозната команда: ${command}`);
  console.log("Подржане команде: create, cancel, full-test");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Грешка:", error);
    process.exit(1);
  }); 