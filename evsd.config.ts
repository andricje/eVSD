import { EvsdConfig, NetworkConfig } from "./types/evsd-config";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const hardhat: NetworkConfig = {
  tokenAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  governorAddress: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  initialUserList: [
    {
      address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      name: "Alice",
    },
  ],
};
const sepolia: NetworkConfig = {
  tokenAddress: "0xF4E761f6359b592Edb8002278920AF21d14C9953",
  governorAddress: "0x73836B9F15819daF12dF636a46f19cFc11Cd024e",
  initialUserList: [
    {
      address: "0x5DE5187A457FA721Df7F2dd0e673B9d0a2500788",
      name: "Veliki Humus",
    },
    {
      address: "0x2b6578D9C592e3aF0743Bd4c34c22adaE4e440e9",
      name: "Mali Humus",
    },
  ],
};

export const config: EvsdConfig = {
  proposalService: {
    type: "blockchain",
    network: sepolia,
  },
};
