"use client";
import {
  InMemoryProposalService,
  Proposal,
  ProposalService,
} from "@/types/proposal";
import { createContext, useEffect, useMemo, useState } from "react";

interface ProposalsContextValue {
  proposals: Proposal[];
  proposalService: ProposalService | undefined;
}

export const ProposalsContext = createContext<
  ProposalsContextValue | undefined
>(undefined);

export const ProposalsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const proposalService = useMemo(
    () => new InMemoryProposalService("0xdeadbeef"),
    []
  );

  useEffect(() => {
    return proposalService?.onProposalsChanged((proposals: Proposal[]) => {
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
