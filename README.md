# EVSD
A decentralized voting platform developed by several students intended to be used for various faculty related voting purposes, especially the events related to the current student movement in Serbia.
This is a frontend that interacts with an OpenZeppelin "Governor" smart contract.

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

## About the project
We use the ["Governor" smart contract](https://docs.openzeppelin.com/contracts/5.x/governance) implemented and audited by OpenZeppelin.
Currently only faculties are meant to have voting rights and all faculties taking part in this system have equal voting rights.
Note that we also deploy an ERC20 token contract also developed by OpenZeppelin. Having tokens (having delegated tokens to be more precise) gives one voting rights. We create a fixed supply of this token and send all of the undistributed tokens to the governor contract on deployment.

### Initialization / deployment
One developer account deploys the contracts (governor and the erc20 token) to the chain creating a fixed supply of the tokens.
The deployer then sends one token to each faculty that is currently part of this voting platform and sends the rest of the tokens to the governor contract so new faculties can be added later by a majoriy vote.

### Proposals
Anyone who has nonzero voting rights can create a proposal by invoking the propose function of the contract. Most proposals have no effects on-chain and are used only as a decentralized, public database. Currently only proposals to add new faculties will have on-chain effects (transfering tokens from the governor contract to a new address).
Anyone who has voting rights votes on these proposals by invoking the castVote method of the contract.


