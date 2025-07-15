"use client";

import { createContext, useState, ReactNode, useEffect, useMemo } from "react";
import { User } from "@/types/proposal";
import { useWallet } from "./wallet-context";
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

function useBlockchainUserService(): UserService | null {
  const { signer } = useWallet();
  return useMemo(() => {
    if (signer) {
      const governor = getEvsdGovernor();
      const token = getEvsdToken();
      const blockchainConfig = getBlockchainConfig();
      return new BlockchainUserService(
        blockchainConfig.initialUserList,
        governor,
        token,
        signer
      );
    }
    return null;
  }, [signer]);
}

function useMemoryUserService(): UserService {
  return new InMemoryUserService([]);
}

function BlockchainUserServiceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const userService = useBlockchainUserService();
  return (
    <AbstractUserServiceProvider userService={userService}>
      {children}
    </AbstractUserServiceProvider>
  );
}

function MockUserServiceProvider({ children }: { children: React.ReactNode }) {
  const userService = useMemoryUserService();
  return (
    <AbstractUserServiceProvider userService={userService}>
      {children}
    </AbstractUserServiceProvider>
  );
}

function AbstractUserServiceProvider({
  children,
  userService,
}: {
  children: ReactNode;
  userService: UserService | null;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[] | null>(null);
  const [userError, setUserError] = useState<string | null>(null);
  const [addressUserMap, setAddressUserMap] = useState<Map<
    string,
    User
  > | null>(null);
  const [isEligibleVoter, setIsEligibleVoter] = useState<boolean | null>(null);
  const { signer } = useWallet();

  useEffect(() => {
    const setUserStates = async () => {
      setUserError(null);
      try {
        const currentAddress = await signer?.getAddress();
        if (userService) {
          setAddressUserMap(await userService.getAddressUserMap());
          setAllUsers(await userService.getAllUsers());
        } else {
          setAddressUserMap(null);
          setAllUsers(null);
        }
        if (currentAddress && userService) {
          setUser(
            (await userService.getUserForAddress(currentAddress)) ?? null
          );
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
    setUserStates();
    const unsub = userService?.onUsersChanged(() => {
      setUserStates();
    });
    return unsub;
  }, [signer, userService]);

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

export function UserServiceProvider({
  children,
  type,
}: {
  children: ReactNode;
  type: "blockchain" | "in-memory";
}) {
  switch (type) {
    case "blockchain":
      return (
        <BlockchainUserServiceProvider>
          {children}
        </BlockchainUserServiceProvider>
      );
    case "in-memory":
      return <MockUserServiceProvider>{children}</MockUserServiceProvider>;
  }
}
