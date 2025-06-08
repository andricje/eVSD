"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import MetamaskLogo from "@/public/metamask.webp";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useWallet } from "@/context/wallet-context";
import { Loader2, Wallet } from "lucide-react";

export function WalletConnectButton() {
  const {
    connect: connectMetaMask,
    connectionStatus,
    walletError,
  } = useWallet();
  const [isOpen, setIsOpen] = useState(false);

  const handleConnect = async () => {
    await connectMetaMask();
    // Zatvaramo dijalog samo ako je povezivanje uspešno
    if (connectionStatus === "connected") {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (walletError) {
      setIsOpen(false);
    }
  }, [walletError]);

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="w-full">
        <Wallet className="h-4 w-4 mr-2" />
        Повежите новчаник
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md w-[90%] sm:w-full rounded-lg pb-2">
          <DialogHeader>
            <DialogTitle>Повежите дигитални новчаник</DialogTitle>
            <DialogDescription>
              Повежите Ваш дигитални новчаник да бисте се пријавили и
              учествовали у гласању.
            </DialogDescription>
          </DialogHeader>

          <div className="w-full -mt-2">
            <div className="flex flex-col items-center justify-center p-4 space-y-4">
              <Image
                src={MetamaskLogo}
                alt="MetaMask logo"
                className="size-24"
              />
              <p className="text-sm text-center text-muted-foreground">
                Повежите се са MetaMask новчаником. Потребно је да имате
                инсталиран MetaMask додатак у вашем претраживачу.
              </p>
              <Button
                className="w-full"
                onClick={() => handleConnect()}
                disabled={connectionStatus === "connecting"}
              >
                {connectionStatus === "connecting" && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {connectionStatus === "connecting"
                  ? "Повезивање..."
                  : "Повежи MetaMask"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
