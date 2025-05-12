import { ethers } from "hardhat";
import { AddressLike, BaseContract, Signer } from "ethers";
import { Announcements, EvsdGovernor, EvsdToken } from "../typechain-types";
import fs from "fs";

export const ONE_TOKEN = ethers.parseUnits("1", 18);

export async function deployTokenAndGovernor(
  deployer: Signer,
): Promise<[EvsdToken, EvsdGovernor, Announcements]> {
  const tokenContract = await deployToken(deployer);
  const governorContract = await deployGovernor(deployer, tokenContract);
  const announcementsContract = await deployAnnouncements(deployer);
  return [tokenContract, governorContract, announcementsContract];
}

export async function deployToken(deployer: Signer) {
  const EvsdTokenFactory = await ethers.getContractFactory(
    "EvsdToken",
    deployer,
  );
  const evsdToken = await EvsdTokenFactory.deploy(deployer);
  await evsdToken.waitForDeployment();
  await evsdToken.getAddress();
  return evsdToken;
}

export async function deployGovernor(
  deployer: Signer,
  deployedTokenAddress: AddressLike,
) {
  const EvsdGovernorFactory = await ethers.getContractFactory(
    "EvsdGovernor",
    deployer,
  );
  const deployerAddress = await deployer.getAddress();
  const evsdGovernor = await EvsdGovernorFactory.deploy(deployedTokenAddress, deployerAddress);
  await evsdGovernor.waitForDeployment();
  return evsdGovernor;
}

export async function deployAnnouncements(deployer: Signer) {
  const AnnouncementsFactory = await ethers.getContractFactory(
    "Announcements",
    deployer,
  );
  const deployerAddress = await deployer.getAddress();
  const announcements = await AnnouncementsFactory.deploy(deployerAddress);
  await announcements.waitForDeployment();
  return announcements;
}

export async function getArtifacts(contract: BaseContract) {
  return {
    address: await contract.getAddress(),
    abi: contract.interface.format(),
  };
}

export async function distributeVotingRights(
  deployer: Signer,
  evsdToken: EvsdToken,
  governor: EvsdGovernor,
  voters: AddressLike[],
) {
  // Send exactly one token to each voter
  for (const adr of voters) {
    await evsdToken.transfer(adr, ONE_TOKEN);
  }

  // Send all remaining tokens to the governor contract
  const remainingTokens = await evsdToken.balanceOf(deployer);
  await evsdToken.transfer(await governor.getAddress(), remainingTokens);
}

async function main() {
  const [deployer, ...voters] = await ethers.getSigners();

  // Deploy the token and governor contracts
  const [evsdToken, evsdGovernor, announcements] = await deployTokenAndGovernor(deployer);

  // Move the artifacts to the frontend directory
  const tokenArtifacts = await getArtifacts(evsdToken);
  const governorArtifacts = await getArtifacts(evsdGovernor);
  const announcementsArtifacts = await getArtifacts(announcements);
  
  fs.writeFileSync(
    "contracts/evsd-token.json",
    JSON.stringify(tokenArtifacts, null, 2),
  );
  fs.writeFileSync(
    "contracts/evsd-governor.json",
    JSON.stringify(governorArtifacts, null, 2),
  );
  fs.writeFileSync(
    "contracts/evsd-announcements.json",
    JSON.stringify(announcementsArtifacts, null, 2),
  );
  
  console.log("Contracts deployed successfully!");
  console.log("Token Address:", tokenArtifacts.address);
  console.log("Governor Address:", governorArtifacts.address);
  console.log("Announcements Address:", announcementsArtifacts.address);

  if (voters.length > 0) {
    // Distribute voting rights to the voters
    await distributeVotingRights(deployer, evsdToken, evsdGovernor, voters);
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
