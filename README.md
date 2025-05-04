# EVSD

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Start the Hardhat local blockchain network node

```bash
npx hardhat node
```

### 3. Deploy the smart contracts required for voting

In a new terminal:

```bash
npx hardhat run scripts/deploy.ts --network localhost
npx hardhat run scripts/delegate-votes.ts --network localhost
```

### 4. Launch the frontend

```bash
npm run dev
```

## Setting up Metamask with the local Hardhat network

1. Install the [Metamask extension](https://metamask.io/download) in your browser.
2. Import a new account with voting rights using any private key from hardhat.config.ts accounts field except the first one. (the first one is the deployer account, whose job is to distribute the voting rights to others in the deploy scripts, and it is the only one that doesn't have voting rights)
3. Add a new network in Metamask with the following settings:
   - Network Name: Hardhat Local
   - New RPC URL: http://127.0.0.1:8545
   - Chain ID: 31337
   - Currency Symbol: ETH
4. Save the network settings and switch to the Hardhat Local network in Metamask.

Now you can connect your Metamask wallet to the frontend.
