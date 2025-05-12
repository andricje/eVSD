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
      accounts: [
        {
          privateKey:
            "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
          balance: "10000000000000000000000",
        },
        {
          privateKey:
            "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
          balance: "10000000000000000000000",
        },
        {
          privateKey:
            "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
          balance: "10000000000000000000000",
        },
        {
          privateKey:
            "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
          balance: "10000000000000000000000",
        },
        {
          privateKey:
            "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a",
          balance: "10000000000000000000000",
        },
        {
          privateKey:
            "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba",
          balance: "10000000000000000000000",
        },
        {
          privateKey:
            "0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e",
          balance: "10000000000000000000000",
        },
      ],
    },
  },
};

export default config;
