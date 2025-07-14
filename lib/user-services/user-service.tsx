import { User } from "@/types/proposal";
import { Unsubscribe } from "../proposal-services/proposal-service";

export interface UserService {
  getUserForAddress(address: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getAddressUserMap(): Promise<Map<string, User>>;
  isEligibleVoter(address: string): Promise<boolean>;
  onUsersChanged(callback: () => void): Unsubscribe;
}
