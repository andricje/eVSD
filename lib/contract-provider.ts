import {
  EvsdGovernor,
  EvsdGovernor__factory,
  EvsdToken,
  EvsdToken__factory,
} from "@/typechain-types";
import { config } from "@/evsd.config";

function getBlockchainConfig() {
  if (config.proposalService.type !== "blockchain") {
    throw new Error("Blockchain not configured in config file");
  }
  return config.proposalService.network;
}

export function getEvsdGovernor(): EvsdGovernor {
  const { governorAddress } = getBlockchainConfig();
  const governor = EvsdGovernor__factory.connect(governorAddress);
  return governor;
}

export function getEvsdToken(): EvsdToken {
  const { tokenAddress } = getBlockchainConfig();
  const token = EvsdToken__factory.connect(tokenAddress);
  return token;
}
