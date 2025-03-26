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
- `construct.ts`: Initializes the DAO and enables extensions

### V2 DAO Traits

The latest version has improved traits deployed on testnet:

- [aibtc-dao-traits-v2](https://explorer.hiro.so/txid/ST1B1CCG03BTGDAAR49R3KM34V48P3RPAQ4P2SSJG.aibtc-dao-traits-v2?chain=testnet)
- [aibtc-dao-v2](https://explorer.hiro.so/txid/ST1B1CCG03BTGDAAR49R3KM34V48P3RPAQ4P2SSJG.aibtc-dao-v2?chain=testnet)

## Workflow Examples

### Example 1: Deploying and Activating a New DAO

1. **Generate and deploy the DAO contracts**:

```
Usage: bun run deploy-dao.ts <tokenSymbol> <tokenName> <tokenMaxSupply> <tokenUri> <logoUrl> <originAddress> <daoManifest> <tweetOrigin> [daoManifestInscriptionId] [generateFiles]

bun run src/aibtc-dao/deploy-dao.ts LFG GoTimeTest 1000000000 https://mkkhfmcrbwyuutcvtier.supabase.co/storage/v1/object/public/tokens//251.json https://mkkhfmcrbwyuutcvtier.supabase.co/storage/v1/object/public/tokens//251.png ST3YT0XW92E6T2FE59B2G5N2WNNFSBZ6MZKQS5D18 "Ze Manifesto goes here and is used for all voting." "1234" "779b53221183cdee5168671b696cf99f60b6be0ce596777ec5f066bf9be44fbfi0" true
```

2. **Construct the DAO with bootstrap proposal**:

```
Usage: bun run construct.ts <baseDaoContract> <proposalContract>

bun run src/aibtc-dao/base-dao/public/construct.ts ST3YT0XW92E6T2FE59B2G5N2WNNFSBZ6MZKQS5D18.lfg-base-dao ST3YT0XW92E6T2FE59B2G5N2WNNFSBZ6MZKQS5D18.lfg-base-bootstrap-initialization-v2
```

3. **Buy tokens to participate in governance**:

```
Usage: bun run exec-buy.ts <btcAmount> <dexContract> [slippage]

bun run src/stacks-faktory/exec-buy.ts 0.0004 ST252TFQ08T74ZZ6XK426TQNV4EXF1D4RMTTNCWFA.lfg-faktory-dex
```

### Example 2: Creating and Managing a Smart Wallet

1. **Create and deploy a new smart wallet between the agent and user**:

```
Usage: bun run deploy-smart-wallet.ts <ownerAddress> <daoTokenContract> <daoTokenDexContract>

bun run src/aibtc-dao/deploy-smart-wallet.ts ST3ZA8Z9DHHM612MYXNT96DJ3E1N7J04ZKQ3H2FSP ST3YT0XW92E6T2FE59B2G5N2WNNFSBZ6MZKQS5D18.lfg-faktory true
```

2. **Get the smart wallet configuration**:

```
Usage: bun run get-configuration.ts <smartWalletContract>

bun run src/aibtc-dao/smart-wallet/read-only/get-configuration.ts ST3ZA8Z9DHHM612MYXNT96DJ3E1N7J04ZKQ3H2FSP.smart-wallet-ST3ZA-H2FSP
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

Proposals follow a standard lifecycle:

1. **Creation**: A token holder submits a proposal
2. **Voting**: Token holders vote based on their balance at proposal creation
3. **Conclusion**: Anyone can conclude a proposal after the voting period
4. **Execution**: If approved, the proposal's code executes automatically

Proposals can be concluded by anyone and should always conclude with a successful transaction.
