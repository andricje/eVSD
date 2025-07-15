import { deployEvsd } from "../lib/deployment";
import { config } from "../evsd.config";
import { network } from "hardhat";
import assert from "assert";

async function main() {
  assert(
    config.proposalService.type === "blockchain",
    "Invalid proposal service type in config"
  );
  if (network.name === "localhost") {
    network.provider.request({
      method: "hardhat_reset",
      params: [],
    });
  }
  const initialVoterAddresses =
    config.proposalService.network.initialUserList.map((v) => v.address);
  const { governor, token } = await deployEvsd(
    initialVoterAddresses,
    true,
    true
  );
  console.log("Deployment complete!");
  console.log(`EvsdGovernor address: ${governor.target}`);
  console.log(`EvsdToken address: ${token.target}`);
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error during deployment:", error);
    process.exit(1);
  });
