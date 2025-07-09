import { useWallet } from "@/context/wallet-context";
import { getEvsdGovernor, getEvsdToken } from "@/lib/contract-provider";
import { ErrorDecoder } from "ethers-decode-error";
import { useEffect, useState } from "react";

function ceil(a: bigint, b: bigint): bigint {
  return (a + b - 1n) / b;
}

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
      const supply = await token.totalSupply();
      const numerator = await governor["quorumNumerator()"]();
      const denominator = await governor.quorumDenominator();
      const quorum = ceil(supply * numerator, denominator);
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
