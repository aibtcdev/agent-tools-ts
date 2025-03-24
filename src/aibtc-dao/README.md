# aibtc-dao Tools

This directory contains Bun TypeScript scripts for interacting with AIBTC DAOs on the Stacks blockchain.

These tools enable the creation, deployment, and management of decentralized autonomous organizations with various extensions and capabilities.

## Overview

The aibtc-dao toolkit is organized into several components:

- **Core Scripts**: generating, deploying, and constructing DAOs
- **Base DAO**: interacting with the base DAO contract
- **Extensions**: interacting with specialized modules that add functionality to the DAO
- **Smart Wallet**: generating, deploying, and managing smart wallets
- **Services**: Registry and utility services that support DAO operations

All interactions with deployed contracts fall into two categories:

- **Public Functions**: Require submitting a transaction to the Stacks blockchain
- **Read-Only Functions**: Query contract data without modifying state

## Architecture

The aibtc-dao system uses a modular architecture:

1. **Base DAO**: Core contract that forms the execution layer of the DAO
2. **Extensions**: Specialized contracts that add functionality to the DAO
3. **Proposals**: Specialized contracts that perform actions on behalf of the DAO
4. **Contract Registry**: Source of truth for contract types, requirements, and deployments
5. **Service Layer**: Utilities for generating and deploying contracts

## Creating a New DAO

Three main scripts handle DAO creation:

- `generate-dao.ts`: Creates contract code without deployment
- `deploy-dao.ts`: Generates and deploys contracts to the blockchain
- `construct-dao.ts`: Initializes the DAO and enables extensions

### V2 DAO Traits

The latest version has improved traits deployed on testnet:

- [aibtc-dao-traits-v2](https://explorer.hiro.so/txid/ST1B1CCG03BTGDAAR49R3KM34V48P3RPAQ4P2SSJG.aibtc-dao-traits-v2?chain=testnet)
- [aibtc-dao-v2](https://explorer.hiro.so/txid/ST1B1CCG03BTGDAAR49R3KM34V48P3RPAQ4P2SSJG.aibtc-dao-v2?chain=testnet)

## Workflow Examples

### Example 1: Deploying and Activating a New DAO

1. **Generate and deploy the DAO contracts**:

```
Usage: bun run deploy-dao.ts <tokenSymbol> <tokenName> <tokenMaxSupply> <tokenUri> <logoUrl> <originAddress> <daoManifest> <tweetOrigin> <daoManifestInscriptionId> <generateFiles>

bun run src/aibtc-dao/deploy-dao.ts LFG4 GoTimeTest 1000000000 https://aibtc.dev https://aibtc.dev ST3YT0XW92E6T2FE59B2G5N2WNNFSBZ6MZKQS5D18 "Ze Manifesto" "1234" "dao manifest inscription id" true
```

2. **Construct the DAO with bootstrap proposal**:

```
Usage: bun run construct-dao.ts <baseDaoContract> <proposalContract>

bun run src/aibtc-dao/construct-dao.ts ST3YT0XW92E6T2FE59B2G5N2WNNFSBZ6MZKQS5D18.lfg4-base-dao ST3YT0XW92E6T2FE59B2G5N2WNNFSBZ6MZKQS5D18.lfg4-base-bootstrap-initialization-v2
```

3. **Buy tokens to participate in governance**:

```
Usage: bun run exec-buy.ts <stxAmount> <dexContract> [slippage]

bun run src/stacks-faktory/exec-buy.ts 100 ST3YT0XW92E6T2FE59B2G5N2WNNFSBZ6MZKQS5D18.lfg4-faktory-dex
```

### Example 2: Creating and Managing a Smart Wallet

1. **Propose creating a new smart wallet**:

```
Usage: bun run propose-create-wallet.ts <daoActionProposalsExtensionContract> <daoSmartWalletExtensionContract> <walletName>

bun run src/aibtc-dao/extensions/smart-wallet/public/propose-create-wallet.ts ST3YT0XW92E6T2FE59B2G5N2WNNFSBZ6MZKQS5D18.lfg4-action-proposals-v2 ST3YT0XW92E6T2FE59B2G5N2WNNFSBZ6MZKQS5D18.lfg4-smart-wallet-v2 "treasury"
```

2. **Vote on the proposal**:

```
Usage: bun run vote-on-proposal.ts <daoActionProposalsExtensionContract> <proposalId> <vote>

bun run src/aibtc-dao/extensions/action-proposals/public/vote-on-proposal.ts ST3YT0XW92E6T2FE59B2G5N2WNNFSBZ6MZKQS5D18.lfg4-action-proposals-v2 1 true
```

3. **Conclude the proposal to create the wallet**:

```
Usage: bun run conclude-proposal.ts <daoActionProposalsExtensionContract> <proposalId> <daoActionProposalContract>

bun run src/aibtc-dao/extensions/action-proposals/public/conclude-proposal.ts ST3YT0XW92E6T2FE59B2G5N2WNNFSBZ6MZKQS5D18.lfg4-action-proposals-v2 1 ST3YT0XW92E6T2FE59B2G5N2WNNFSBZ6MZKQS5D18.lfg4-smart-wallet-v2
```

### Example 3: Submitting and Processing a Core Proposal

1. **Propose a core change to the DAO**:

```
Usage: bun run propose-core-change.ts <daoCoreProposalsExtensionContract> <proposalContract> <proposalDetails>

bun run src/aibtc-dao/extensions/core-proposals/public/propose-core-change.ts ST3YT0XW92E6T2FE59B2G5N2WNNFSBZ6MZKQS5D18.lfg4-core-proposals-v2 ST3YT0XW92E6T2FE59B2G5N2WNNFSBZ6MZKQS5D18.lfg4-core-proposal-change-threshold "Change voting threshold to 60%"
```

2. **Vote on the core proposal**:

```
Usage: bun run vote-on-core-proposal.ts <daoCoreProposalsExtensionContract> <proposalContract> <vote>

bun run src/aibtc-dao/extensions/core-proposals/public/vote-on-core-proposal.ts ST3YT0XW92E6T2FE59B2G5N2WNNFSBZ6MZKQS5D18.lfg4-core-proposals-v2 ST3YT0XW92E6T2FE59B2G5N2WNNFSBZ6MZKQS5D18.lfg4-core-proposal-change-threshold true
```

3. **Conclude the core proposal**:

```
Usage: bun run conclude-core-proposal.ts <daoCoreProposalsExtensionContract> <proposalContract>

bun run src/aibtc-dao/extensions/core-proposals/public/conclude-core-proposal.ts ST3YT0XW92E6T2FE59B2G5N2WNNFSBZ6MZKQS5D18.lfg4-core-proposals-v2 ST3YT0XW92E6T2FE59B2G5N2WNNFSBZ6MZKQS5D18.lfg4-core-proposal-change-threshold
```

## Contract Interaction

### Public Functions

Require submitting a transaction to the Stacks blockchain. Examples include:

- Proposing actions
- Voting on proposals
- Concluding proposals
- Creating wallets
- Transferring assets

### Read-Only Functions

Query contract data without modifying state. Examples include:

- Checking proposal status
- Viewing wallet balances
- Getting voting power
- Retrieving DAO configuration

## Services

The services directory provides:

- **Contract Registry**: Source of truth for contract types and requirements
- **Contract Generator**: Creates contract code from templates
- **Contract Deployer**: Handles deployment to the blockchain

## Notes on Proposal Lifecycle

Proposals follow a standard life cycle:

1. **Creation**: A token holder submits a proposal
2. **Voting**: Token holders vote based on their balance at proposal creation
3. **Conclusion**: Anyone can conclude a proposal after the voting period
4. **Execution**: If approved, the proposal's code executes automatically

Proposals can be concluded by anyone and should always conclude with a successful transaction.
