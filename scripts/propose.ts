import { ethers } from "hardhat";
import governorArtifacts from "../contracts/evsd-governor.json";
import tokenArtifacts from "../contracts/evsd-token.json";
import {
  EvsdGovernor__factory,
  EvsdToken,
  EvsdToken__factory,
} from "../typechain-types";
import { Signer } from "ethers";
import { createProposalDoNothing } from "@/lib/blockchain-utils";

async function delegateVoteToSelf(evsdToken: EvsdToken, voter: Signer) {
  await evsdToken.delegate(await voter.getAddress());
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const governor = EvsdGovernor__factory.connect(
    governorArtifacts.address,
    deployer
  );
  const evsdToken = EvsdToken__factory.connect(
    tokenArtifacts.address,
    deployer
  );
  await delegateVoteToSelf(evsdToken, deployer);
  await createProposalDoNothing(deployer, governor, "Proposal to do nothing");
  console.log("Proposal created successfully");
}

main();
