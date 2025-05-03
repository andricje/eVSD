import { ethers } from "ethers";
import { useEffect, useState } from "react";

export function useBrowserSigner() {
  const [signerAddress, setSignerAddress] = useState<string>();
  const [provider, setProvider] = useState<ethers.BrowserProvider>();
  const [signer, setSigner] = useState<ethers.Signer>();
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  useEffect(() => {
    async function connectWallet() {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.BrowserProvider(ethereum);
        const signer = await provider.getSigner();
        setProvider(provider);
        setSigner(signer);
        const address = await signer.getAddress();
        setSignerAddress(address);
        setStatus("ready");
        console.log("signer", signer);
      } else {
        setStatus("error");
        console.error("No Ethereum provider found");
      }
    }
    connectWallet();
  }, []);
  return { provider, signer, signerAddress, status };
}
