"use client";

import { useProposals } from "@/hooks/use-proposals";
import { convertAddressToName } from "@/lib/utils";
import { WalletAddress } from "./wallet-address";

export function WalletInfo() {
  const { signerAddress } = useProposals();

  if (!signerAddress) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <div className="font-medium text-lg">
        {convertAddressToName(signerAddress)}
      </div>
      <WalletAddress
        address={signerAddress}
        className="text-sm text-muted-foreground"
        iconSize={3}
      />
    </div>
  );
}
