import { ethers } from "hardhat";
import { EvsdToken__factory } from "../typechain-types";

async function main() {
  const signers = await ethers.getSigners();
  const token = EvsdToken__factory.connect(
    "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    signers[0]
  );

  console.log("Провера стања токена свих налога:");
  console.log("===================================");

  for (let i = 0; i < signers.length; i++) {
    const address = await signers[i].getAddress();
    const balance = await token.balanceOf(address);
    const votePower = await token.getVotes(address);

    console.log(`Налог ${i}: ${address}`);
    console.log(`  Стање токена: ${ethers.formatUnits(balance, 18)}`);
    console.log(`  Гласачка моћ: ${ethers.formatUnits(votePower, 18)}`);
    console.log("-----------------------------------");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Грешка:", error);
    process.exit(1);
  });
