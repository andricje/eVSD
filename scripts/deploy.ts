import hardhat from "hardhat";
import { AddressLike, BaseContract, ethers, Signer } from "ethers";
import { EvsdGovernor, EvsdToken } from "../typechain-types";
import fs from "fs";

export const ONE_TOKEN = hardhat.ethers.parseUnits("1", 18);

export async function deployTokenAndGovernor(
  deployer: Signer
): Promise<[EvsdToken, EvsdGovernor]> {
  const tokenContract = await deployToken(deployer);
  const governorContract = await deployGovernor(deployer, tokenContract);
  return [tokenContract, governorContract];
}

export async function deployToken(deployer: Signer) {
  const EvsdTokenFactory = await hardhat.ethers.getContractFactory(
    "EvsdToken",
    deployer
  );
  const evsdToken = await EvsdTokenFactory.deploy(deployer);
  await evsdToken.waitForDeployment();
  await evsdToken.getAddress();
  return evsdToken;
}

export async function deployGovernor(
  deployer: Signer,
  deployedTokenAddress: AddressLike
) {
  const EvsdGovernorFactory = await hardhat.ethers.getContractFactory(
    "EvsdGovernor",
    deployer
  );
  const evsdGovernor = await EvsdGovernorFactory.deploy(deployedTokenAddress);
  await evsdGovernor.waitForDeployment();
  return evsdGovernor;
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
  voters: AddressLike[]
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
  const [deployer, ...voters] = await hardhat.ethers.getSigners();

  // Deploy the token and governor contracts
  const [evsdToken, evsdGovernor] = await deployTokenAndGovernor(
    deployer as unknown as ethers.Signer
  );

  // Move the artifacts to the frontend directory
  const tokenArtifacts = await getArtifacts(evsdToken);
  const governorArtifacts = await getArtifacts(evsdGovernor);
  fs.writeFileSync(
    "contracts/evsd-token.json",
    JSON.stringify(tokenArtifacts, null, 2)
  );
  fs.writeFileSync(
    "contracts/evsd-governor.json",
    JSON.stringify(governorArtifacts, null, 2)
  );
  console.log("Token and Governor contracts deployed successfully!");
  console.log("Token Address:", tokenArtifacts.address);
  console.log("Governor Address:", governorArtifacts.address);

  if (voters.length > 0) {
    // Distribute voting rights to the voters
    await distributeVotingRights(
      deployer as unknown as ethers.Signer,
      evsdToken,
      evsdGovernor,
      voters
    );
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
