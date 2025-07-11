"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { User } from "@/types/proposal";
import { useWallet } from "./wallet-context";
import { Provider, Signer } from "ethers";
import { UserService } from "@/lib/user-services/user-service";
import { BlockchainUserService } from "@/lib/user-services/blockchain-user-service";
import { InMemoryUserService } from "@/lib/user-services/in-memory-user-service";
import {
  getBlockchainConfig,
  getEvsdGovernor,
  getEvsdToken,
} from "@/lib/contract-provider";

export interface UserServiceContextType {
  isCurrentUserEligibleVoter: boolean | null;
  currentUser: User | null;
  allUsers: User[] | null;
  getUserForAddress: (address: string) => User | undefined;
  userService: UserService | null;
  userError: string | null;
}

export const UserContext = createContext<UserServiceContextType | undefined>(
  undefined
);

function AbstractUserServiceProvider({
  children,
  userFactory: userServiceFactory,
}: {
  children: ReactNode;
  userFactory: (signer: Signer | null) => Promise<UserService>;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[] | null>(null);
  const [userError, setUserError] = useState<string | null>(null);
  const [userService, setUserService] = useState<UserService | null>(null);
  const [addressUserMap, setAddressUserMap] = useState<Map<
    string,
    User
  > | null>(null);
  const [isEligibleVoter, setIsEligibleVoter] = useState<boolean | null>(null);
  const { provider, signer } = useWallet();

  useEffect(() => {
    const getUserAndService = async (
      provider: Provider,
      signer: Signer | null
    ) => {
      setUserError(null);
      try {
        const userService = await userServiceFactory(signer);
        setUserService(userService);
        setAddressUserMap(await userService.getAddressUserMap());
        const currentAddress = await signer?.getAddress();
        if (currentAddress) {
          setUser(
            (await userService.getUserForAddress(currentAddress)) ?? null
          );
          setAllUsers(await userService.getAllUsers());
          setIsEligibleVoter(await userService.isEligibleVoter(currentAddress));
        } else {
          setUser(null);
          setIsEligibleVoter(false);
        }
      } catch (error) {
        setUserError(error instanceof Error ? error.message : "Unknown error");
        console.error("Error fetching user:", error);
      }
    };
    if (provider) {
      getUserAndService(provider, signer);
    } else {
      setUser(null);
    }
  }, [provider, signer, userServiceFactory]);

  return (
    <UserContext.Provider
      value={{
        currentUser: user,
        getUserForAddress: (address: string) => {
          return addressUserMap?.get(address);
        },
        userService,
        allUsers,
        userError,
        isCurrentUserEligibleVoter: isEligibleVoter,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

async function blockchainUserServiceFactory(
  signer: Signer | null
): Promise<UserService> {
  const { ethereum } = window;
  if (ethereum) {
    const governor = getEvsdGovernor();
    const token = getEvsdToken();
    const blockchainConfig = getBlockchainConfig();
    return new BlockchainUserService(
      blockchainConfig.initialUserList,
      governor,
      token,
      signer
    );
  } else {
    throw new Error(
      "MetaMask is not found. Please ensure the MetaMask extension is installed."
    );
  }
}

async function inMemoryUserServiceFactory(): Promise<UserService> {
  return new InMemoryUserService([]);
}

export function UserServiceProvider({
  children,
  type,
}: {
  children: ReactNode;
  type: "blockchain" | "in-memory";
}) {
  const userFactory =
    type === "blockchain"
      ? blockchainUserServiceFactory
      : inMemoryUserServiceFactory;
  return (
    <AbstractUserServiceProvider userFactory={userFactory}>
      {children}
    </AbstractUserServiceProvider>
  );
}
