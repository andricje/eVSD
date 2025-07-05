"use client";
import { UserIcon } from "lucide-react";

import { useWallet } from "@/context/wallet-context";
import { Badge } from "./ui/badge";
import { WalletAddress } from "./wallet-address";
import { useUserService } from "@/hooks/use-userservice";

interface WalletInfoProps {
  showName?: boolean;
}

export function WalletInfo({ showName = false }: WalletInfoProps) {
  const { currentUser: user } = useUserService();

  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center justify-between bg-background py-4 px-2 rounded-lg">
      <div className="flex items-center gap-4">
        <div>
          {/* Umesto imena korisnika trebalo bi prikazati fakultet, koji će se povući iz konteksta, kada bude dostupno */}
          {showName && (
            <div className="flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-primary" />
              <p className="text-base font-semibold text-foreground">
                {user.name}
              </p>
            </div>
          )}
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="px-2 py-0.5 text-sm">
              <span className="text-muted-foreground">
                <WalletAddress address={user.address} />
              </span>
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
