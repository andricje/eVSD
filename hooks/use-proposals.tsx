import { useContext } from "react";
import { ProposalsContext } from "./proposals-context";

export const useProposals = () => {
  const context = useContext(ProposalsContext);
  if (!context) {
    throw new Error("useProposals must be used within a ProposalsContext");
  }
  return context;
};
