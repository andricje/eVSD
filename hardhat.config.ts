import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",  
    settings: {
      optimizer: {
        enabled: true,
        runs: 200  
      }
    }
  },
  networks: {
    hardhat: {
      accounts: {
        count: 50,
      },

    },
  },
};

export default config;
