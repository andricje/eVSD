import { AddressLike, parseUnits } from "ethers";
import hardhat from "hardhat";
import { config } from "../evsd.config";
import assert from "assert";
export async function fund(
  initialVoters: AddressLike[],
  amount: number,
  minAmountToFund: number
) {
  const [deployer] = await hardhat.ethers.getSigners();
  const minAmountInt = parseUnits(minAmountToFund.toString(), "ether");
  for (const address of initialVoters) {
    try {
      const oldBalance = await deployer.provider.getBalance(address);
      if (oldBalance >= minAmountInt) {
        continue;
      }
      console.log(`Should fund address: ${address} Balance is: ${oldBalance}`);
      const tx = await deployer.sendTransaction({
        to: address,
        value: parseUnits(amount.toString(), "ether"),
      });
      await tx.wait();
      const newBalance = await deployer.provider.getBalance(address);
      console.log(`Address ${address} new balance: ${newBalance}`);
    } catch (ex) {
      console.log(`Failed sending to address: ${address}`);
    }
  }
}
async function main() {
  assert(
    config.proposalService.type === "blockchain",
    "Invalid proposal service type in config"
  );
  const initialVoterAddresses =
    config.proposalService.network.initialUserList.map((v) => v.address);
  await fund(initialVoterAddresses, 0.00008354, 0.00003);
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
