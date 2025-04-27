import { ethers } from "ethers";
import { useEffect, useState } from "react";

export interface UseBrowserSignerReturn
{
    provider: ethers.BrowserProvider | undefined;
    signer: ethers.Signer | undefined;
    signerAddress: string | undefined;
    status: "loading" | "ready" | "error";
}

export function useBrowserSigner()
{
  const [signerAddress, setSignerAddress] = useState<string>();
  const [provider, setProvider] = useState<ethers.BrowserProvider>();
  const [signer, setSigner] = useState<ethers.Signer>();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  async function connectWallet() {
        const { ethereum } = window;
        if (ethereum) {
            const provider = new ethers.BrowserProvider(ethereum);
            const signer = await provider.getSigner();
            setProvider(provider);
            setSigner(signer);
            setSignerAddress(await signer.getAddress());
            setStatus("ready");
        } else {
            setStatus("error");
            console.error("No Ethereum provider found");
        }
    }
  useEffect(() => {
    connectWallet();
    return () => {};
  },[]);
  return {provider, signer, signerAddress, status};
}