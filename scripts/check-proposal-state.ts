import { ethers } from "hardhat";
import { EvsdGovernor__factory } from "../typechain-types";
import governorArtifacts from "../contracts/evsd-governor.json";

// Мапа за интерпретацију стања предлога
const proposalStates: Record<number, string> = {
  0: "Чека се",
  1: "Активан",
  2: "Отказан",
  3: "Поражен",
  4: "Успешан",
  5: "У реду за извршење",
  6: "Извршен",
  7: "Истекао"
};

async function main() {
  const [deployer] = await ethers.getSigners();
  const governor = EvsdGovernor__factory.connect(governorArtifacts.address, deployer);
  
  // Користимо фиксни ID предлога из грешке коју је корисник добио
  const proposalId = "0x7048f99ecf384ac60cad3cb4650decdf8d468c48ed2ce914217326ca8d4a216d";
  console.log(`Провера стања предлога: ${proposalId}`);
  
  try {
    // Добављамо стање предлога
    const state = await governor.state(proposalId);
    const stateNumber = Number(state);
    
    console.log(`Стање предлога: ${stateNumber} (${proposalStates[stateNumber] || "Непознато"})`);
    
    // Проверавамо да ли је предлог активан
    if (stateNumber === 1) {
      console.log("Предлог је активан и доступан за гласање.");
      
      // Проверавамо када истиче гласање
      const deadline = await governor.proposalDeadline(proposalId);
      const currentBlock = await ethers.provider.getBlockNumber();
      console.log(`Тренутни блок: ${currentBlock}`);
      console.log(`Рок за гласање: ${deadline} (остало још ${Number(deadline) - currentBlock} блокова)`);
      
      // Проверавамо кворум
      const quorum = await governor.quorum(0); // 0 је произвољан блок број
      console.log(`Потребан кворум: ${ethers.formatUnits(quorum, 18)} гласова`);
      
      // Узимамо тренутно стање гласова
      const votes = await governor.proposalVotes(proposalId);
      console.log("Тренутно стање гласова:");
      console.log(`  За: ${ethers.formatUnits(votes.forVotes, 18)}`);
      console.log(`  Против: ${ethers.formatUnits(votes.againstVotes, 18)}`);
      console.log(`  Уздржани: ${ethers.formatUnits(votes.abstainVotes, 18)}`);
      
      // Проверавамо да ли је први налог већ гласао
      const account = await deployer.getAddress();
      const hasVoted = await governor.hasVoted(proposalId, account);
      console.log(`Да ли је налог ${account} већ гласао: ${hasVoted}`);
    } else {
      console.log("Предлог није у стању за гласање.");
      
      if (stateNumber === 0) {
        const snapshot = await governor.proposalSnapshot(proposalId);
        const currentBlock = await ethers.provider.getBlockNumber();
        console.log(`Snapshot блок: ${snapshot}`);
        console.log(`Тренутни блок: ${currentBlock}`);
        console.log(`Гласање ће бити активно за ${Number(snapshot) - currentBlock} блокова`);
      }
    }
  } catch (error) {
    console.error("Грешка при провери предлога:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Грешка:", error);
    process.exit(1);
  }); 