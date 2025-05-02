import { ethers } from "hardhat";
import governorArtifacts from "../contracts/evsd-governor.json";
import tokenArtifacts from "../contracts/evsd-token.json";
import {
  EvsdGovernor__factory,
  EvsdToken,
  EvsdToken__factory,
} from "../typechain-types";
import { Signer } from "ethers";
import { createProposalDoNothing } from "../lib/utils";

async function delegateVoteToSelf(evsdToken: EvsdToken, voter: Signer) {
  await evsdToken.delegate(await voter.getAddress());
}

async function main() {
  const [_, wallet1] = await ethers.getSigners();
  const governor = EvsdGovernor__factory.connect(
    governorArtifacts.address,
    wallet1
  );
  const evsdToken = EvsdToken__factory.connect(tokenArtifacts.address, wallet1);
  await delegateVoteToSelf(evsdToken, wallet1);
  await createProposalDoNothing(wallet1, governor, "Proposal to do nothing");
  console.log("Proposal created successfully");
}

main();
