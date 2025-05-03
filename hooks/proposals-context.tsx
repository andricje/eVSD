"use client";
import {
  convertGovernorToVoteOption,
  convertVoteOptionToGovernor,
  getDeployedContracts,
  getProposals,
} from "@/lib/utils";
import { Proposal } from "@/types/proposal";
import { Signer } from "ethers";
import { createContext, useEffect, useState } from "react";
import { useBrowserSigner } from "./use-browser-signer";
import { EvsdGovernor, EvsdToken } from "@/typechain-types";

interface ProposalsContextValue {
  proposals: Proposal[];
  signer: Signer | undefined;
  signerAddress: string | undefined;
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
  const { signer, signerAddress } = useBrowserSigner();
  useEffect(() => {
    if (!signer) {
      return;
    }

    const { governor, token } = getDeployedContracts(signer);
    const voteCastFilter = governor.filters.VoteCast();

    // Function to fetch historical data once
    async function fetchInitialProposals(
      governor: EvsdGovernor,
      token: EvsdToken,
      signer: Signer
    ) {
      const proposals = await getProposals(governor, token, signer);
      setProposals(proposals);
    }

    // Listen to new voteCast events and update proposals
    governor.on(
      voteCastFilter,
      (voter, proposalId, support, weight, reason, event) => {
        // Make a new array and new proposal objects instead of reusing existing ones to make sure all components and child components re-render
        const newProposals: Proposal[] = [];
        for (const proposal of proposals) {
          const newProposal = { ...proposal } as Proposal;
          if (newProposal.id === proposalId) {
            newProposal.votesForAddress[voter] =
              convertGovernorToVoteOption(support);
          }
          newProposals.push(newProposal);
        }
        setProposals(newProposals);
      }
    );

    fetchInitialProposals(governor, token, signer);

    // Cleanup listeners on unmount
    return () => {
      governor.removeAllListeners();
    };
  }, [signer]);

  return (
    <ProposalsContext.Provider value={{ proposals, signer, signerAddress }}>
      {children}
    </ProposalsContext.Provider>
  );
};
