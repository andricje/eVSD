"use client";
import {
  BlockchainProposalService,
  InMemoryProposalService,
  Proposal,
  ProposalService,
} from "@/types/proposal";
import { createContext, useEffect, useMemo, useState } from "react";
import { useWallet } from "@/context/wallet-context";
import { InMemoryProposalFileService } from "@/lib/file-upload";

interface ProposalsContextValue {
  proposals: Proposal[];
  proposalService: ProposalService | null;
}

export const ProposalsContext = createContext<
  ProposalsContextValue | undefined
>(undefined);

function useMockProposalService(): ProposalService | null {
  const { user } = useWallet();
  return useMemo(() => user && new InMemoryProposalService(user), [user]);
}

function useBlockchainProposalService(): ProposalService | null {
  const { provider, signer } = useWallet();
  return useMemo(() => {
    if (signer && provider) {
      return new BlockchainProposalService(
        signer,
        new InMemoryProposalFileService(),
        provider
      );
    }
    return null;
  }, [provider, signer]);
}

const AbstractProposalsProvider = ({
  children,
  proposalService,
}: {
  children: React.ReactNode;
  proposalService: ProposalService | null;
}) => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  useEffect(() => {
    proposalService?.onProposalsChanged((proposals) => {
      setProposals(proposals);
    });
  }, [proposalService]);

  return (
    <ProposalsContext.Provider
      value={{
        proposals,
        proposalService,
      }}
    >
      {children}
    </ProposalsContext.Provider>
  );
};

function BlockchainProposalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const proposalService = useBlockchainProposalService();
  return (
    <AbstractProposalsProvider proposalService={proposalService}>
      {children}
    </AbstractProposalsProvider>
  );
}

function MockProposalProvider({ children }: { children: React.ReactNode }) {
  const proposalService = useMockProposalService();
  return (
    <AbstractProposalsProvider proposalService={proposalService}>
      {children}
    </AbstractProposalsProvider>
  );
}

export function ProposalsProvider({
  children,
  type,
}: {
  children: React.ReactNode;
  type: "mock" | "blockchain";
}) {
  switch (type) {
    case "blockchain":
      return (
        <BlockchainProposalProvider>{children}</BlockchainProposalProvider>
      );
    case "mock":
      return <MockProposalProvider>{children}</MockProposalProvider>;
    default:
      throw new Error("Invalid proposal service type");
  }
}
