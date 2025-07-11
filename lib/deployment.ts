import {
  EvsdGovernor__factory,
  EvsdToken,
  EvsdToken__factory,
} from "../typechain-types";
import { AddressLike, ethers } from "ethers";
import hardhat from "hardhat";

async function deployToken(deployer: ethers.Signer) {
  const contractFactory = await hardhat.ethers.getContractFactory(
    "EvsdToken",
    deployer
  );
  const deployment = await contractFactory.deploy(deployer);
  await deployment.waitForDeployment();
  return deployment;
}

async function deployGovernor(deployer: ethers.Signer, token: EvsdToken) {
  const contractFactory = await hardhat.ethers.getContractFactory(
    "EvsdGovernor",
    deployer
  );
  const deployment = await contractFactory.deploy(await token.getAddress());
  await deployment.waitForDeployment();
  return deployment;
}

export async function deployEvsd(
  initialVoters: AddressLike[],
  transferOwnership: boolean = true
) {
  const [deployer] = await hardhat.ethers.getSigners();
  const evsdToken = await deployToken(deployer as unknown as ethers.Signer);
  const evsdGovernor = await deployGovernor(
    deployer as unknown as ethers.Signer,
    evsdToken
  );
  console.log(
    `Deployed contracts, token: ${await evsdToken.getAddress()}, governor: ${await evsdGovernor.getAddress()}`
  );

  for (const address of initialVoters) {
    let success = false;
    while (!success) {
      try {
        const tx = await evsdToken.mint(address, 1);
        await tx.wait();
        console.log(`Minted tokens to address: ${address}`);
        success = true;
      } catch (ex) {
        console.log(`Failed to mint tokens to address: ${address} retrying...`);
      }
    }
  }
  if (transferOwnership) {
    try {
      const tx = await evsdToken.transferOwnership(
        await evsdGovernor.getAddress()
      );
      await tx.wait();
    } catch (ex) {
      console.log(`Failed to transfer ownership exception: ${ex}`);
    }
  }
  return {
    governor: evsdGovernor,
    token: evsdToken,
  };
}
