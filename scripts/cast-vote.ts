import { getDeployedContracts } from "../lib/blockchain-utils";
import { getProposals } from "@/lib/blockchain-utils";
import { castVote } from "@/lib/blockchain-utils";
import { EvsdToken } from "../typechain-types";
import { Signer } from "ethers";
import { ethers } from "hardhat";

async function delegateVoteToSelf(evsdToken: EvsdToken, voter: Signer) {
  await evsdToken.connect(voter).delegate(await voter.getAddress());
}

async function main() {
  const signers = await ethers.getSigners();
  for (const signer of signers) {
    const { governor, token } = getDeployedContracts(signer);
    const allProposals = await getProposals(governor, token, signer);
    await delegateVoteToSelf(token, signer);
    await castVote(signer, governor, allProposals[0].id, 0);
  }
}
main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error: ", error);
    process.exit(1);
  });
