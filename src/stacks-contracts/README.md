# Stacks Contracts Deployment Tools

This directory contains tools for deploying smart contracts to the Stacks blockchain.

## Available Scripts

### 1. General Contract Deployment

Deploy a contract with source code provided directly:

```
bun run deploy-contract.ts <contractName> <sourceCode> [clarityVersion]
```

Example:
```
bun run deploy-contract.ts my-contract "(define-public (hello-world) (ok u1))" 3
```

### 2. File-based Contract Deployment

Deploy a contract from a source file:

```
bun run deploy-contract-from-file.ts <contractName> <sourceFile> [clarityVersion]
```

Example:
```
bun run deploy-contract-from-file.ts my-contract ./contracts/hello-world.clar 2
```

### 3. DAO Governance Contract Deployment

Deploy a pre-built DAO governance contract that includes:
- SIP-010 compliant fungible token (1M total supply)
- Proposal submission, voting, and execution mechanisms
- Token-based governance system
- Initial token distribution (80% to contract, 20% to owner)

```
bun run deploy-dao-governance.ts <contractName> [clarityVersion]
```

Example:
```
bun run deploy-dao-governance.ts my-dao-governance 2
```

## Configuration

Deployment uses the environment variables defined in your .env file:
- `NETWORK`: The target network (testnet or mainnet)
- `MNEMONIC`: The seed phrase for the deployer account
- `ACCOUNT_INDEX`: The account index to use (default: 0)

## Usage After Deployment

The DAO governance contract automatically initializes when deployed, minting 80% of tokens to the contract itself and 20% to the contract owner.

You can immediately:

1. Submit proposals with `submit-proposal`
2. Vote on proposals with `vote`
3. Execute approved proposals with `execute-proposal`
4. Query proposal status with `get-proposal`
5. Check token balances with `get-balance`

These functions can be called via contract-call transactions. 