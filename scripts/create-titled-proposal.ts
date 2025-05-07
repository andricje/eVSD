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

  // Прво делегирамо токене себи (за сваки случај)
  await delegateVoteToSelf(evsdToken, deployer);

  // Креирамо предлог са насловом и описом
  const title = "Предлог за нову библиотеку";
  const description =
    "Овим предлогом се тражи изградња нове библиотеке у оквиру факултета која би била доступна студентима 24/7.";

  console.log("Креирање предлога са насловом:", title);
  console.log("И описом:", description);

  // Позивамо функцију за креирање предлога
  await createProposalDoNothing(deployer, governor, description, title);

  console.log("Предлог успешно креиран!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Грешка:", error);
    process.exit(1);
  });
