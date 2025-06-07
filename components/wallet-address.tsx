"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { clipAddress } from "@/lib/utils";

interface WalletAddressProps {
  address: string;
  className?: string;
  iconSize?: number;
}

export function WalletAddress({
  address,
  className,
  iconSize = 3,
}: WalletAddressProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy address:", err);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span>{clipAddress(address)}</span>
      <div className="size-2 hidden"></div>
      <div className="size-3 hidden"></div>
      <div className="size-4 hidden"></div>
      <button
        onClick={handleCopy}
        aria-label="Copy address"
        className="rounded hover:bg-gray-100 transition-colors"
      >
        {copied ? (
          <Check className={`size-${iconSize} text-green-500`} />
        ) : (
          <Copy className={`size-${iconSize}`} />
        )}
      </button>
    </div>
  );
}
