interface NetworkConfig {
  tokenAddress: string;
  governorAddress: string;
}

interface BlockchainProposalServiceConfig {
  type: "blockchain";
  network: NetworkConfig;
}

interface InMemoryProposalServiceConfig {
  type: "in-memory";
}

type ProposalServiceConfig =
  | BlockchainProposalServiceConfig
  | InMemoryProposalServiceConfig;

export type ProposalServiceType = ProposalServiceConfig["type"];

export interface EvsdConfig {
  proposalService: ProposalServiceConfig;
}
