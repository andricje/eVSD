import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      accounts: {
        count: 50,
      },
    },
    sepolia: {
      url: "https://ethereum-sepolia-rpc.publicnode.com",
      accounts: [],
    },
    arbitrum_sepolia: {
      url: "https://api.zan.top/arb-sepolia",
      accounts: [],
    },
    arbitrum: {
      url: "https://arb1.arbitrum.io/rpc",
      accounts: [],
    },
  },
};

export default config;
