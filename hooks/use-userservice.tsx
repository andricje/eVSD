import { UserContext } from "@/context/user-context";
import { useContext } from "react";

export function useUserService() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUserService must be used within a UserServiceProvider");
  }
  return context;
}
