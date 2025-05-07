import { ethers } from "hardhat";
import { EvsdToken__factory } from "../typechain-types";
import tokenArtifacts from "../contracts/evsd-token.json";

async function main() {
  // Користимо први доступан налог (deployer)
  const [_, userAccount] = await ethers.getSigners();
  const userAddress = await userAccount.getAddress();
  
  console.log("Делегирање гласова за корисника:", userAddress);
  
  // Повезујемо се са токен уговором
  const token = EvsdToken__factory.connect(tokenArtifacts.address, userAccount);
  
  // Проверавамо баланс токена
  const balance = await token.balanceOf(userAddress);
  console.log(`Баланс токена: ${ethers.formatUnits(balance, 18)}`);
  
  // Проверавамо тренутно делегиране гласове
  const votePower = await token.getVotes(userAddress);
  console.log(`Тренутна гласачка моћ: ${ethers.formatUnits(votePower, 18)}`);
  
  // Делегирање гласова себи
  if (balance > 0n) {
    try {
      const tx = await token.delegate(userAddress);
      console.log(`Трансакција делегирања: ${tx.hash}`);
      await tx.wait();
      console.log("Делегирање успешно извршено");
      
      // Проверавамо нову гласачку моћ
      const newVotePower = await token.getVotes(userAddress);
      console.log(`Нова гласачка моћ: ${ethers.formatUnits(newVotePower, 18)}`);
    } catch (error) {
      console.error("Грешка при делегирању:", error);
    }
  } else {
    console.log("Корисник нема токене за делегирање!");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Грешка:", error);
    process.exit(1);
  }); 