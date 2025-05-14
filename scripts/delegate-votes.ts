import evsdTokenArtifacts from "../contracts/evsd-token.json";

import { EvsdToken, EvsdToken__factory } from "../typechain-types";
import { ethers, Signer } from "ethers";
import hardhat from "hardhat";

async function delegateVoteToSelf(evsdToken: EvsdToken, voter: Signer) {
  await evsdToken.connect(voter).delegate(await voter.getAddress());
}

export async function delegateVotesToAllSigners() {
  const signers = await hardhat.ethers.getSigners();

  for (const signer of signers) {
    const token = EvsdToken__factory.connect(
      evsdTokenArtifacts.address,
      signer
    );
    token.delegate(await signer.getAddress());
    await delegateVoteToSelf(token, signer as unknown as ethers.Signer);
  }
}

async function main() {
  await delegateVotesToAllSigners();
}
main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error during deployment:", error);
    process.exit(1);
  });
