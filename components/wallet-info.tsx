"use client";

import { useProposals } from "@/hooks/use-proposals";
import { convertAddressToName } from "@/lib/utils";
import { Copy, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export function WalletInfo() {
  const { signerAddress } = useProposals();
  const [copied, setCopied] = useState(false);

  if (!signerAddress) {
    return null;
  }

  const copyAddress = () => {
    navigator.clipboard.writeText(signerAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Skraćeni prikaz adrese
  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="flex items-center gap-2">
      <div className="font-medium text-lg">
        {convertAddressToName(signerAddress)}
      </div>
      <div className="flex items-center text-sm text-muted-foreground">
        {shortenAddress(signerAddress)}
        <button onClick={copyAddress} className="ml-1 p-1 hover:text-blue-500">
          {copied ? (
            <CheckCircle2 className="h-3 w-3" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </button>
      </div>
    </div>
  );
}
