"use client";
import { getProposals, getDeployedContracts } from "@/lib/blockchain-utils";
import { Proposal } from "@/types/proposal";
import { Contract, Signer } from "ethers";
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
    async function fetchAllProposals(
      governor: EvsdGovernor,
      token: EvsdToken,
      signer: Signer
    ) {
      const proposals = await getProposals(governor, token, signer);
      setProposals(proposals);
    }

    // Listen to new voteCast events and update proposals. For some reason calling .on directly on the EvsdGovernor fails to properly unpack the arguments so first cast into an ethers contract (this is fine)
    const ethersGovernor = governor as unknown as Contract;
    ethersGovernor.on(
      ethersGovernor.filters.VoteCast,
      (voter, proposalId, support, weight, reason) => {
        fetchAllProposals(governor, token, signer);
      }
    );

    fetchAllProposals(governor, token, signer);

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
