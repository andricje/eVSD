import { User } from "@/types/proposal";
import { UserService } from "./user-service";
import { Unsubscribe } from "../proposal-services/proposal-service";

export class InMemoryUserService implements UserService {
  private readonly addressUserMap: Map<string, User>;
  constructor(users: User[]) {
    this.addressUserMap = new Map<string, User>();
    for (const user of users) {
      this.addressUserMap.set(user.address, user);
    }
  }
  onUsersChanged(_callback: () => void): Unsubscribe {
    throw new Error("Method not implemented.");
  }
  async isEligibleVoter(address: string): Promise<boolean> {
    return this.addressUserMap.has(address);
  }
  async getAddressUserMap(): Promise<Map<string, User>> {
    return this.addressUserMap;
  }
  async getAllUsers(): Promise<User[]> {
    return [...this.addressUserMap.values()];
  }
  async getUserForAddress(address: string): Promise<User | undefined> {
    return this.getUserForAddress(address);
  }
}
