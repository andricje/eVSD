import { User } from "@/types/proposal";

export interface UserService {
  getUserForAddress(address: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getAddressUserMap(): Promise<Map<string, User>>;
}
