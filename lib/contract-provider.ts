import {
  EvsdGovernor,
  EvsdGovernor__factory,
  EvsdToken,
  EvsdToken__factory,
} from "@/typechain-types";
import governorArtifacts from "@/contracts/evsd-governor.json";
import tokenArtifacts from "@/contracts/evsd-token.json";

export function getEvsdGovernor(): EvsdGovernor {
  const governor = EvsdGovernor__factory.connect(governorArtifacts.address);
  return governor;
}

export function getEvsdToken(): EvsdToken {
  const token = EvsdToken__factory.connect(tokenArtifacts.address);
  return token;
}
