"use client";
import { createContext, useEffect, useMemo, useState } from "react";
import { useWallet } from "@/context/wallet-context";
import { InMemoryProposalFileService } from "@/lib/file-upload";
import { BlockchainProposalService } from "@/lib/proposal-services/blockchain/blockchain-proposal-service";
import { InMemoryProposalService } from "@/lib/proposal-services/in-memory/in-memory-proposal-service";
import { ProposalService } from "@/lib/proposal-services/proposal-service";
import { Proposal } from "@/types/proposal";
import { getEvsdGovernor, getEvsdToken } from "@/lib/contract-provider";
import { ProposalServiceType } from "@/types/evsd-config";

export interface ProposalsContextValue {
  proposals: Proposal[];
  proposalService: ProposalService | null;
  loading: boolean;
  setLoading: (loading: boolean) => void;
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
        getEvsdGovernor(),
        getEvsdToken(),
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
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    proposalService?.onProposalsChanged((proposals) => {
      setProposals(proposals);
    });

    const fetchInitialProposals = async () => {
      if (proposalService) {
        setLoading(true);
        const initialProposals = await proposalService.getProposals();
        setProposals(initialProposals);
        setLoading(false);
      }
    };

    fetchInitialProposals();
  }, [proposalService]);

  return (
    <ProposalsContext.Provider
      value={{
        proposals,
        proposalService,
        loading,
        setLoading,
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
  type: ProposalServiceType;
}) {
  switch (type) {
    case "blockchain":
      return (
        <BlockchainProposalProvider>{children}</BlockchainProposalProvider>
      );
    case "in-memory":
      return <MockProposalProvider>{children}</MockProposalProvider>;
  }
}
