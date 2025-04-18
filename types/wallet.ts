export interface WalletInfo {
  address: string
  chainId: number
  provider: "metamask" | "walletconnect" | "other"
  ensName?: string
  balance?: string
}

export interface AuthorizedWallet {
  address: string
  faculty: string
  authorized: boolean
  lastLogin?: string
}

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error"
