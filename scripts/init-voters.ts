import { ethers } from "hardhat";
import { EvsdGovernor__factory } from "../typechain-types";
import governorArtifacts from "../contracts/evsd-governor.json";
import { addressNameMap } from "../lib/address-name-map";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Повезивање са EvsdGovernor уговором...");
  const governor = EvsdGovernor__factory.connect(
    governorArtifacts.address,
    deployer
  );
  
  console.log("Тренутни власник:", await governor.owner());
  console.log("Повезани налог:", await deployer.getAddress());
  
  // Добијамо све адресе из address-name-map.ts
  const voters = Object.keys(addressNameMap);
  console.log(`Укупно: ${voters.length} адреса за регистрацију.`);
  
  // Региструјемо све адресе
  let successCount = 0;
  let alreadyRegisteredCount = 0;
  
  for (const voter of voters) {
    try {
      // Проверавамо да ли је адреса већ регистрована
      const isRegistered = await governor.hasVotingRights(voter);
      
      if (!isRegistered) {
        console.log(`Регистрација адресе ${voter} (${addressNameMap[voter]})...`);
        const tx = await governor.registerVoter(voter);
        await tx.wait();
        successCount++;
        console.log(`Успешно регистрован: ${voter}`);
      } else {
        console.log(`Адреса ${voter} је већ регистрована.`);
        alreadyRegisteredCount++;
      }
    } catch (error) {
      console.error(`Грешка при регистрацији адресе ${voter}:`, error);
    }
  }
  
  // Проверавамо тренутни кворум
  const totalVoters = await governor.totalVoters();
  const quorumValue = await governor.quorum(0);
  
  console.log("---------- Извештај о гласачима ----------");
  console.log(`Укупно адреса за регистрацију: ${voters.length}`);
  console.log(`Успешно регистровано: ${successCount} адреса.`);
  console.log(`Већ регистровано: ${alreadyRegisteredCount} адреса.`);
  console.log(`Укупно регистрованих гласача: ${totalVoters}`);
  console.log(`Тренутни кворум (50%+1): ${quorumValue / BigInt(10**18)} гласова`);
  
  // Верификација - проверавамо да ли све адресе из мапе имају права гласа
  console.log("\n---------- Верификација гласачких права ----------");
  let errorCount = 0;
  for (const voter of voters) {
    const hasRights = await governor.hasVotingRights(voter);
    if (!hasRights) {
      console.error(`ГРЕШКА: Адреса ${voter} (${addressNameMap[voter]}) нема права гласа!`);
      errorCount++;
    }
  }
  
  if (errorCount === 0) {
    console.log(" Све адресе имају исправна права гласа.");
  } else {
    console.error(` ${errorCount} адреса нема исправна права гласа.`);
  }
  
  // Проверавамо да ли су све адресе на смарт уговору заиста из наше мапе
  console.log("\n---------- Провера непознатих адреса ----------");
  const voterRegisteredFilter = governor.filters.VoterRegistered();
  const events = await governor.queryFilter(voterRegisteredFilter);
  
  for (const event of events) {
    const registeredAddress = event.args.voter;
    if (!(registeredAddress in addressNameMap)) {
      console.warn(`УПОЗОРЕЊЕ: Непозната адреса са правом гласа: ${registeredAddress}`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Грешка:", error);
    process.exit(1);
  }); 