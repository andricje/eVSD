"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWallet } from "@/context/wallet-context";
import { Loader2, Wallet } from "lucide-react";
// Zakomentarisaću import QR koda
// import QRCodeReact from "qrcode.react"

export function WalletConnectButton() {
  const { connectMetaMask, connectWalletConnect, connectionStatus } =
    useWallet();
  const [isOpen, setIsOpen] = useState(false);

  const handleConnect = async (method: "metamask" | "walletconnect") => {
    if (method === "metamask") {
      await connectMetaMask();
    } else {
      await connectWalletConnect();
    }

    // Zatvaramo dijalog samo ako je povezivanje uspešno
    if (connectionStatus === "connected") {
      setIsOpen(false);
    }
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <Wallet className="h-4 w-4 mr-2" />
        Poveži novčanik
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Poveži kripto novčanik</DialogTitle>
            <DialogDescription>
              Povežite vaš kripto novčanik da biste se prijavili i učestvovali u
              glasanju.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="metamask" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="metamask">MetaMask</TabsTrigger>
              <TabsTrigger value="walletconnect">WalletConnect</TabsTrigger>
            </TabsList>

            <TabsContent value="metamask" className="mt-4">
              <div className="flex flex-col items-center justify-center p-4 space-y-4">
                <img
                  src="/placeholder.svg?height=80&width=80"
                  alt="MetaMask logo"
                  className="h-20 w-20"
                />
                <p className="text-sm text-center text-muted-foreground">
                  Povežite se sa MetaMask novčanikom. Potrebno je da imate
                  instaliran MetaMask dodatak u vašem pretraživaču.
                </p>
                <Button
                  className="w-full"
                  onClick={() => handleConnect("metamask")}
                  disabled={connectionStatus === "connecting"}
                >
                  {connectionStatus === "connecting" && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {connectionStatus === "connecting"
                    ? "Povezivanje..."
                    : "Poveži MetaMask"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="walletconnect" className="mt-4">
              <div className="flex flex-col items-center justify-center p-4 space-y-4">
                <div className="border p-4 rounded-md bg-muted text-center">
                  <img
                    src="/placeholder.svg?height=150&width=150"
                    alt="WalletConnect"
                    className="h-[150px] w-[150px] mx-auto mb-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    WalletConnect QR kod
                  </p>
                </div>
                <p className="text-sm text-center text-muted-foreground">
                  Skenirajte QR kod sa vašim mobilnim novčanikom koji podržava
                  WalletConnect.
                </p>
                <Button
                  className="w-full"
                  onClick={() => handleConnect("walletconnect")}
                  disabled={connectionStatus === "connecting"}
                >
                  {connectionStatus === "connecting" && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {connectionStatus === "connecting"
                    ? "Povezivanje..."
                    : "Poveži WalletConnect"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
