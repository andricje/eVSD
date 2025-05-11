"use client";
import evsdGovernorArtifacts from "../contracts/evsd-governor.json";
import {
  BlockchainProposalService,
  Proposal,
  ProposalService,
} from "@/types/proposal";
import { Contract, ethers, Signer } from "ethers";
import { createContext, useEffect, useState } from "react";
import { useBrowserSigner } from "./use-browser-signer";
import { InMemoryProposalFileService } from "@/lib/file-upload";

interface ProposalsContextValue {
  proposals: Proposal[];
  signer: Signer | undefined;
  signerAddress: string | undefined;
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
  const { provider, signer, signerAddress } = useBrowserSigner();
  const [proposalService, setProposalService] = useState<ProposalService>();
  useEffect(() => {
    if (!signer || !provider) {
      return;
    }

    const governor = new ethers.Contract(
      evsdGovernorArtifacts.address,
      evsdGovernorArtifacts.abi,
      signer
    );

    const fileService = new InMemoryProposalFileService();
    const service = new BlockchainProposalService(
      signer,
      fileService,
      provider
    );
    setProposalService(service);
    // Function to fetch historical data once
    async function fetchAllProposals() {
      const proposals = await service.getProposals();
      setProposals(proposals);
    }

    // Listen to new voteCast events and update proposals. For some reason calling .on directly on the EvsdGovernor fails to properly unpack the arguments so first cast into an ethers contract (this is fine)
    const ethersGovernor = governor as unknown as Contract;
    ethersGovernor.on(
      ethersGovernor.filters.VoteCast,
      (voter, proposalId, support, weight, reason) => {
        fetchAllProposals();
      }
    );

    fetchAllProposals();

    // Cleanup listeners on unmount
    return () => {
      governor.removeAllListeners();
    };
  }, [signer, provider]);

  return (
    <ProposalsContext.Provider
      value={{
        proposals,
        signer,
        signerAddress,
        proposalService,
      }}
    >
      {children}
    </ProposalsContext.Provider>
  );
};
