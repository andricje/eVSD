"use client";

import { convertAddressToName } from "@/lib/utils";
import { User } from "@/types/proposal";
import { MetaMaskInpageProvider } from "@metamask/providers";
import { ethers, Provider, Signer } from "ethers";
import { createContext, useContext, useState, type ReactNode } from "react";

declare global {
  interface Window {
    ethereum?: MetaMaskInpageProvider;
  }
}

interface WalletContextType {
  provider: Provider | null;
  signer: Signer | null;
  user: User | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  connectionStatus: "connected" | "connecting" | "disconnected";
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

function AbstractWalletProvider({
  children,
  walletFactory,
}: {
  children: ReactNode;
  walletFactory: () => Promise<{
    provider: Provider | null;
    signer: Signer | null;
    user: User | null;
  }>;
}) {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [signer, setSigner] = useState<Signer | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "connecting" | "disconnected"
  >("disconnected");

  const connect = async () => {
    setConnectionStatus("connecting");
    try {
      const result = await walletFactory();

      setProvider(result.provider);
      setSigner(result.signer);
      setUser(result.user);
      setConnectionStatus("connected");
    } catch (error) {
      console.error("Greška pri povezivanju sa novčanikom:", error);
      setConnectionStatus("disconnected");
    }
  };

  // Prekid veze sa novčanikom
  const disconnect = () => {
    setProvider(null);
    setSigner(null);
    setUser(null);
    setConnectionStatus("disconnected");
  };

  return (
    <WalletContext.Provider
      value={{
        provider,
        signer,
        user,
        connect,
        disconnect,
        connectionStatus,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

async function getProviderAndSigner() {
  const { ethereum } = window;
  if (ethereum) {
    const provider = new ethers.BrowserProvider(ethereum);
    const signer = await provider.getSigner();
    return { provider, signer };
  } else {
    throw new Error("MetaMask is not installed");
  }
}

async function blockchainWalletFactory(): Promise<{
  provider: Provider | null;
  signer: Signer | null;
  user: User | null;
}> {
  const { provider, signer } = await getProviderAndSigner();
  const address = await signer.getAddress();

  const user = {
    address,
    name: convertAddressToName(address),
  };

  return { provider, signer, user };
}

async function mockWalletFactory(): Promise<{
  provider: Provider | null;
  signer: Signer | null;
  user: User | null;
}> {
  const address = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

  const user = {
    address,
    name: convertAddressToName(address),
  };

  return {
    provider: null,
    signer: null,
    user,
  };
}

export function WalletProvider({
  children,
  type,
}: {
  children: ReactNode;
  type: "blockchain" | "mock";
}) {
  const walletFactory =
    type === "blockchain" ? blockchainWalletFactory : mockWalletFactory;
  return (
    <AbstractWalletProvider walletFactory={walletFactory}>
      {children}
    </AbstractWalletProvider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
