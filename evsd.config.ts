import { EvsdConfig, NetworkConfig } from "./types/evsd-config";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const hardhat: NetworkConfig = {
  tokenAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  governorAddress: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  initialUserList: [
    {
      address: "0xDf37F81dAAD2b0327A0A50003740e1C935C70913",
      name: "Veliki Humus",
    },
  ],
};
const sepolia: NetworkConfig = {
  tokenAddress: "0x65E953e4D8B4c27BEe51E3fa2af8ff141C5611D2",
  governorAddress: "0xbbd71385538f36b771885975A0EDB0F5530aC0Cc",
  initialUserList: [],
};

export const config: EvsdConfig = {
  proposalService: {
    type: "blockchain",
    network: hardhat,
  },
};
