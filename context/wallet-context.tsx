"use client";

import { ProposalServiceType } from "@/types/evsd-config";
import { MetaMaskInpageProvider } from "@metamask/providers";
import { ethers, Provider, Signer } from "ethers";
import { createContext, useContext, useState, type ReactNode } from "react";
import { User } from "@/types/proposal";
import { useUserService } from "@/hooks/use-userservice";

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
  walletError: string | null;
  loading: boolean;
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
  }>;
}) {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [signer, setSigner] = useState<Signer | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "connecting" | "disconnected"
  >("disconnected");
  const [walletError, setWalletError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const { currentUser } = useUserService();

  const connect = async () => {
    setWalletError(null);
    setConnectionStatus("connecting");
    try {
      setLoading(true);
      const result = await walletFactory();

      setProvider(result.provider);
      setSigner(result.signer);
      setUser(currentUser);
      setConnectionStatus("connected");
    } catch (error) {
      setWalletError(error instanceof Error ? error.message : "Unknown error");
      console.error("Greška pri povezivanju sa novčanikom:", error);
      setConnectionStatus("disconnected");
    } finally {
      setLoading(false);
    }
  };

  // Prekid veze sa novčanikom
  const disconnect = () => {
    setProvider(null);
    setSigner(null);
    setUser(null);
    setConnectionStatus("disconnected");
    setWalletError(null);
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
        walletError,
        loading,
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
    throw new Error(
      "MetaMask није пронађен. Проверите да ли је екстензија инсталирана. Уколико јесте, поново покрените претраживач."
    );
  }
}

async function blockchainWalletFactory(): Promise<{
  provider: Provider | null;
  signer: Signer | null;
}> {
  const { provider, signer } = await getProviderAndSigner();
  return { provider, signer };
}

async function mockWalletFactory(): Promise<{
  provider: Provider | null;
  signer: Signer | null;
}> {
  return {
    provider: null,
    signer: null,
  };
}

export function WalletProvider({
  children,
  type,
}: {
  children: ReactNode;
  type: ProposalServiceType;
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
