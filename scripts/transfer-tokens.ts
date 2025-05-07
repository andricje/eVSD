import { ethers } from "hardhat";
import { EvsdToken__factory } from "../typechain-types";
import tokenArtifacts from "../contracts/evsd-token.json";

const ONE_TOKEN = ethers.parseUnits("1", 18);

async function main() {
  // Узимамо све доступне налоге
  const [deployer, user1] = await ethers.getSigners();
  
  console.log("Пребацујем токене са налога:", await deployer.getAddress());
  console.log("На налог:", await user1.getAddress());
  
  // Повезујемо се са токен уговором
  const token = EvsdToken__factory.connect(tokenArtifacts.address, deployer);
  
  // Проверавамо колико токена има корисник
  const initialBalance = await token.balanceOf(await user1.getAddress());
  console.log(`Почетно стање: ${ethers.formatUnits(initialBalance, 18)} токена`);
  
  // Шаљемо токене 
  const tx = await token.transfer(await user1.getAddress(), ONE_TOKEN);
  console.log(`Трансакција: ${tx.hash}`);
  await tx.wait();
  console.log("Трансакција потврђена");
  
  // Проверавамо ново стање
  const newBalance = await token.balanceOf(await user1.getAddress());
  console.log(`Ново стање: ${ethers.formatUnits(newBalance, 18)} токена`);
  
  // Делегирамо токене 
  const tokenAsUser = token.connect(user1);
  const delegateTx = await tokenAsUser.delegate(await user1.getAddress());
  console.log(`Делегирање: ${delegateTx.hash}`);
  await delegateTx.wait();
  console.log("Делегирање потврђено");
  
  console.log("Успешно пребачени и делегирани токени!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Грешка:", error);
    process.exit(1);
  }); 