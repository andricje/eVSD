import evsdTokenArtifacts from "../contracts/evsd-token.json";

import { EvsdToken, EvsdToken__factory } from "../typechain-types";
import { Signer } from "ethers";
import { ethers } from "hardhat";

async function delegateVoteToSelf(evsdToken: EvsdToken, voter: Signer) {
  await evsdToken.connect(voter).delegate(await voter.getAddress());
}

async function main() {
  const signers = await ethers.getSigners();

  for (const signer of signers) {
    const token = EvsdToken__factory.connect(
      evsdTokenArtifacts.address,
      signer
    );
    token.delegate(await signer.getAddress());
    await delegateVoteToSelf(token, signer);
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
