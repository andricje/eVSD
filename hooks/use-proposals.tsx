import { getDeployedContracts, getProposals } from "@/lib/utils";
import { Proposal } from "@/types/proposal";
import { useEffect, useState } from "react";
import { useBrowserSigner } from "./use-browser-signer";

export function useProposals() {
  const { signer } = useBrowserSigner();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  useEffect(() => {
    const fillProposals = async () => {
      if (signer) {
        const { governor } = getDeployedContracts(signer);
        const proposals = await getProposals(governor);
        console.log("proposals", proposals);
        setProposals(proposals);
      }
    };
    fillProposals();
  }, [signer]);
  return proposals;
}
