"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

// Tipovi za wallet
type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

interface WalletInfo {
  address: string;
  chainId: number;
  provider: string;
  ensName?: string;
}

interface AuthorizedWallet {
  address: string;
  faculty: string;
  authorized: boolean;
  lastLogin?: string;
}

// Deklaracija za window.ethereum
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      disconnect?: () => void;
    };
  }
}

// Simulirani podaci za autorizovane novčanike
const AUTHORIZED_WALLETS: AuthorizedWallet[] = [
  {
    address: "0x1234567890123456789012345678901234567890",
    faculty: "Fakultet tehničkih nauka",
    authorized: true,
  },
  {
    address: "0x2345678901234567890123456789012345678901",
    faculty: "Pravni fakultet",
    authorized: true,
  },
  {
    address: "0x3456789012345678901234567890123456789012",
    faculty: "Ekonomski fakultet",
    authorized: true,
  },
  {
    address: "0x4567890123456789012345678901234567890123",
    faculty: "Medicinski fakultet",
    authorized: true,
  },
];

interface WalletContextType {
  wallet: WalletInfo | null;
  connectionStatus: ConnectionStatus;
  authorizedWallet: AuthorizedWallet | null;
  connectMetaMask: () => Promise<void>;
  connectWalletConnect: () => Promise<void>;
  disconnect: () => void;
  signMessage: (message: string) => Promise<string | null>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("disconnected");
  const [authorizedWallet, setAuthorizedWallet] =
    useState<AuthorizedWallet | null>(null);
  const router = useRouter();

  // Proverava da li je novčanik autorizovan
  const checkAuthorization = (address: string) => {
    const wallet = AUTHORIZED_WALLETS.find(
      (w) => w.address.toLowerCase() === address.toLowerCase() && w.authorized,
    );
    return wallet || null;
  };

  // Simulacija povezivanja sa MetaMask-om
  const connectMetaMask = async () => {
    try {
      setConnectionStatus("connecting");

      // Simulacija povezivanja sa MetaMask-om
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Simulacija dobijanja adrese novčanika
      const mockWallet: WalletInfo = {
        address: "0x1234567890123456789012345678901234567890",
        chainId: 1,
        provider: "metamask",
        ensName: "ftn.eth",
      };

      setWallet(mockWallet);
      setConnectionStatus("connected");

      // Provera autorizacije
      const authorized = checkAuthorization(mockWallet.address);
      if (authorized) {
        setAuthorizedWallet({
          ...authorized,
          lastLogin: new Date().toISOString(),
        });
      } else {
        setConnectionStatus("error");
      }
    } catch (error) {
      console.error("Error connecting to MetaMask:", error);
      setConnectionStatus("error");
    }
  };

  // Simulacija povezivanja sa WalletConnect-om
  const connectWalletConnect = async () => {
    try {
      setConnectionStatus("connecting");

      // Simulacija povezivanja sa WalletConnect-om
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Simulacija dobijanja adrese novčanika
      const mockWallet: WalletInfo = {
        address: "0x2345678901234567890123456789012345678901",
        chainId: 1,
        provider: "walletconnect",
      };

      setWallet(mockWallet);
      setConnectionStatus("connected");

      // Provera autorizacije
      const authorized = checkAuthorization(mockWallet.address);
      if (authorized) {
        setAuthorizedWallet({
          ...authorized,
          lastLogin: new Date().toISOString(),
        });
      } else {
        setConnectionStatus("error");
      }
    } catch (error) {
      console.error("Error connecting to WalletConnect:", error);
      setConnectionStatus("error");
    }
  };

  // Simulacija potpisivanja poruke
  const signMessage = async (message: string): Promise<string | null> => {
    if (!wallet) return null;

    try {
      // Simulacija potpisivanja poruke
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Simulacija potpisa
      return `0x${Array.from({ length: 130 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
    } catch (error) {
      console.error("Error signing message:", error);
      return null;
    }
  };

  // Prekid veze sa novčanikom
  const disconnect = () => {
    // Čišćenje podataka o novčaniku
    setWallet(null);
    setAuthorizedWallet(null);
    setConnectionStatus("disconnected");
    
    // Čišćenje localStorage-a
    localStorage.clear();
    
    // Čišćenje MetaMask konekcije (ako je dostupan)
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        // Za novije verzije MetaMask-a
        if (window.ethereum.disconnect) {
          window.ethereum.disconnect();
        }
      } catch (error) {
        console.error("Greška pri odjavljivanju iz MetaMask-a:", error);
      }
    }
    
    // Preusmeravanje na login stranicu
    router.push('/login');
  };

  return (
    <WalletContext.Provider
      value={{
        wallet,
        connectionStatus,
        authorizedWallet,
        connectMetaMask,
        connectWalletConnect,
        disconnect,
        signMessage,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
