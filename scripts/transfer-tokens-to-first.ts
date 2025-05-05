import { ethers } from "hardhat";
import { EvsdToken__factory } from "../typechain-types";
import tokenArtifacts from "../contracts/evsd-token.json";

const ONE_TOKEN = ethers.parseUnits("1", 18);

async function main() {
  // Узимамо налоге
  const [deployer, secondAccount] = await ethers.getSigners();
  
  console.log("Пребацујем токене са другог налога:", await secondAccount.getAddress());
  console.log("На први налог:", await deployer.getAddress());
  
  // Повезујемо се са токен уговором као други налог
  const token = EvsdToken__factory.connect(tokenArtifacts.address, secondAccount);
  
  // Провера стања
  const initialBalanceSecond = await token.balanceOf(await secondAccount.getAddress());
  const initialBalanceFirst = await token.balanceOf(await deployer.getAddress());
  
  console.log(`Почетно стање другог налога: ${ethers.formatUnits(initialBalanceSecond, 18)} токена`);
  console.log(`Почетно стање првог налога: ${ethers.formatUnits(initialBalanceFirst, 18)} токена`);
  
  // Трансфер токена са другог на први налог
  const tx = await token.transfer(await deployer.getAddress(), ONE_TOKEN);
  console.log(`Трансакција послата: ${tx.hash}`);
  await tx.wait();
  console.log("Трансакција потврђена");
  
  // Провера новог стања
  const newBalanceSecond = await token.balanceOf(await secondAccount.getAddress());
  const newBalanceFirst = await token.balanceOf(await deployer.getAddress());
  
  console.log(`Ново стање другог налога: ${ethers.formatUnits(newBalanceSecond, 18)} токена`);
  console.log(`Ново стање првог налога: ${ethers.formatUnits(newBalanceFirst, 18)} токена`);
  
  // Повезујемо се на токен уговор као први налог
  const tokenAsFirst = EvsdToken__factory.connect(tokenArtifacts.address, deployer);
  
  // Делегирамо токене првом налогу
  const delegateTx = await tokenAsFirst.delegate(await deployer.getAddress());
  console.log(`Делегирање послато: ${delegateTx.hash}`);
  await delegateTx.wait();
  console.log("Делегирање потврђено");
  
  // Провера гласачке моћи
  const votingPower = await tokenAsFirst.getVotes(await deployer.getAddress());
  console.log(`Гласачка моћ првог налога: ${ethers.formatUnits(votingPower, 18)}`);
  
  console.log("Успешно пребачени и делегирани токени!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Грешка:", error);
    process.exit(1);
  }); 