import { getDeployedContracts, getProposals } from "@/lib/utils";
import { Proposal } from "@/types/proposal";
import { Signer } from "ethers";
import { useEffect, useState } from "react";
import { useBrowserSigner } from "./use-browser-signer";

export function useProposals()
{
    const {signer} = useBrowserSigner();
    const [proposals, setProposals] = useState<Proposal[]>([]);
    useEffect(() => {
        if(signer)
        {
            const deployedContracts = getDeployedContracts(signer);
            (async () => {
                setProposals(await getProposals(deployedContracts.governor));
            })();
        }
        return () => {};
    },[signer]);
    return proposals;
}