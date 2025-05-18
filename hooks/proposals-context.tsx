"use client";
import {
  Proposal,
} from "@/types/proposal";
import { createContext, useEffect, useMemo, useState } from "react";
import { useUser } from "./use-user";
import { ProposalService } from "@/lib/proposal-services/proposal-service";
import { InMemoryProposalService } from "@/lib/proposal-services/in-memory-proposal-service";

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
  const user = useUser();
  const proposalService = useMemo(
    () => user && new InMemoryProposalService(user),
    [user]
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
