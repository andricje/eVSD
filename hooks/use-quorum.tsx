import { useWallet } from "@/context/wallet-context";
import { getEvsdGovernor, getEvsdToken } from "@/lib/contract-provider";
import { calculateQuorumFromContracts } from "@/lib/utils";
import { ErrorDecoder } from "ethers-decode-error";
import { useEffect, useState } from "react";

export function useQuorum(): number | null {
  const [quorum, setQuorum] = useState<number | null>(null);
  const { provider } = useWallet();
  useEffect(() => {
    const fetchQuorum = async () => {
      if (!provider) {
        setQuorum(null);
        return;
      }
      const governor = getEvsdGovernor().connect(provider);
      const token = getEvsdToken().connect(provider);
      const quorum = calculateQuorumFromContracts(governor, token);
      try {
        setQuorum(Number(quorum));
      } catch (error) {
        const decoder = ErrorDecoder.create([
          governor.interface,
          token.interface,
        ]);
        const decoded = await decoder.decode(error);
        console.error(decoded);
      }
    };
    fetchQuorum();
  }, [provider]);

  return quorum;
}
