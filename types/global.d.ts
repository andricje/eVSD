import { EIP1193Provider } from "ethers";

declare global {
  interface Window {
    ethereum?: EIP1193Provider;
  }
}