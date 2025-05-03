"use client";

import { useWallet } from "@/context/wallet-context";
import { Copy, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export function WalletInfo() {
  const { wallet, authorizedWallet } = useWallet();
  const [copied, setCopied] = useState(false);

  if (!wallet || !authorizedWallet) {
    return null;
  }

  const copyAddress = () => {
    navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Skraćeni prikaz adrese
  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="font-medium text-lg">{authorizedWallet.faculty}</div>
      <div className="flex items-center text-sm text-muted-foreground">
        {wallet.ensName || shortenAddress(wallet.address)}
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
