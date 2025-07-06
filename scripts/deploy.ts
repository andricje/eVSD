import hardhat from "hardhat";
import { AddressLike, ethers, Signer } from "ethers";
import { EvsdGovernor, EvsdToken } from "../typechain-types";

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

export async function distributeVotingRights(
  deployer: Signer,
  evsdToken: EvsdToken,
  governor: EvsdGovernor,
  voters: AddressLike[]
) {
  // Send exactly one token to each voter
  for (const adr of voters) {
    await evsdToken.mint(adr, ONE_TOKEN);
  }

  // Transfer ownership to the governor contract
  await evsdToken.transferOwnership(await governor.getAddress());
}

async function main() {
  const [deployer, ...voters] = await hardhat.ethers.getSigners();

  // Deploy the token and governor contracts
  const [evsdToken, evsdGovernor] = await deployTokenAndGovernor(
    deployer as unknown as ethers.Signer
  );

  console.log("Token and Governor contracts deployed successfully!");
  console.log("Token Address:", await evsdToken.getAddress());
  console.log("Governor Address:", await evsdGovernor.getAddress());

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
