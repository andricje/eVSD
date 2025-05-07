import { ethers } from "hardhat";
import governorArtifacts from "../contracts/evsd-governor.json";
import tokenArtifacts from "../contracts/evsd-token.json";
import {
  EvsdGovernor__factory,
  EvsdToken__factory,
} from "../typechain-types";

async function main() {
  const [deployer] = await ethers.getSigners();
  const governor = EvsdGovernor__factory.connect(
    governorArtifacts.address,
    deployer,
  );
  
  console.log("Листа свих предлога:");
  console.log("===================================");
  
  // Добављамо све догађаје креирања предлога
  const proposalCreatedFilter = governor.filters.ProposalCreated();
  const events = await governor.queryFilter(proposalCreatedFilter, 0, "latest");
  
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const proposalId = event.args.proposalId;
    const description = event.args.description;
    const proposer = event.args.proposer;
    
    console.log(`Предлог #${i+1} (ID: ${proposalId}):`);
    
    // Извлачимо наслов из описа ако је у правилном формату
    let title = "Предлог за гласање";
    let cleanDescription = description;
    
    // Проверавамо да ли опис садржи наслов у формату "НАСЛОВ:наслов|опис"
    if (description.startsWith("НАСЛОВ:")) {
      const parts = description.substring(7).split("|", 2);
      if (parts.length === 2) {
        title = parts[0];
        cleanDescription = parts[1];
      }
    }
    
    console.log(`  Наслов: ${title}`);
    console.log(`  Опис: ${cleanDescription}`);
    console.log(`  Предлагач: ${proposer}`);
    
    // Проверавамо стање предлога
    const state = await governor.state(proposalId);
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
    console.log(`  Стање: ${proposalStates[Number(state)] || "Непознато"}`);
    
    // Приказујемо тренутне гласове
    const votes = await governor.proposalVotes(proposalId);
    console.log(`  Гласови за: ${ethers.formatUnits(votes.forVotes, 18)}`);
    console.log(`  Гласови против: ${ethers.formatUnits(votes.againstVotes, 18)}`);
    console.log(`  Уздржани гласови: ${ethers.formatUnits(votes.abstainVotes, 18)}`);
    
    console.log("-----------------------------------");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Грешка:", error);
    process.exit(1);
  }); 