import { User } from "@/types/proposal";
import { useMemo } from "react";

export function useUser(): User | undefined {
  return useMemo(
    () => ({
      address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      name: "Fakultet 1",
    }),
    []
  );
}
