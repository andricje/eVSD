import { getDeployedContracts } from "../lib/blockchain-utils";
import { EvsdToken } from "../typechain-types";
import { Signer } from "ethers";
import { ethers } from "hardhat";

async function delegateVoteToSelf(evsdToken: EvsdToken, voter: Signer) {
  await evsdToken.connect(voter).delegate(await voter.getAddress());
}

async function main() {
  const signers = await ethers.getSigners();
  for (const signer of signers) {
    const deployedContracts = getDeployedContracts(signer);
    await delegateVoteToSelf(deployedContracts.token, signer);
  }
}
main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error during deployment:", error);
    process.exit(1);
  });
