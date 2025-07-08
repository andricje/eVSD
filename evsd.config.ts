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

const arbitrumSepolia: NetworkConfig = {
  tokenAddress: "0x4183A1Be2aAFA0BBb9b8591A2F4629B007ab7A54",
  governorAddress: "0x4725F9698D218CF21a7E835597d47a6E4a46b1e0",
  initialUserList: [
    {
      address: "0x5DE5187A457FA721Df7F2dd0e673B9d0a2500788",
      name: "Veliki Humus",
    },
    {
      address: "0x2b6578D9C592e3aF0743Bd4c34c22adaE4e440e9",
      name: "Mali Humus",
    },
    {
      address: "0xE60Ea9b8A1fb8190f54924b2A8A4235d2b69cf55",
      name: "Srednji Humus",
    },
  ],
};

const arbitrum: NetworkConfig = {
  tokenAddress: "0xEF6936404af1F32859e974CBC08B936fAB39b1C0",
  governorAddress: "0xCD35b35490FCC3294AF8eb255C8D2524fc2C7511",
  initialUserList: [
    {
      address: "0x5DE5187A457FA721Df7F2dd0e673B9d0a2500788",
      name: "Veliki Humus",
    },
    {
      address: "0x2b6578D9C592e3aF0743Bd4c34c22adaE4e440e9",
      name: "Mali Humus",
    },
    {
      address: "0xE60Ea9b8A1fb8190f54924b2A8A4235d2b69cf55",
      name: "Srednji Humus",
    },
  ],
};

export const config: EvsdConfig = {
  proposalService: {
    type: "blockchain",
    network: arbitrum,
  },
};
