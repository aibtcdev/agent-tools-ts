# STX.CITY Bonding Curve Implementation

This directory contains the implementation of STX.CITY's bonding curve mechanism for token launches on the Stacks blockchain. The implementation consists of two main smart contracts and several TypeScript utilities for interacting with the bonding curve DEX.

## Overview

The bonding curve implementation provides a decentralized way to launch and trade tokens on Stacks, with the following key features:

- Automated market making using a bonding curve
- Target STX amount-based completion mechanism
- Automated token burning and distribution upon completion
- Built-in fee structure for sustainability
- SIP-010 compliant token implementation

## Smart Contracts

### Token Contract

The token contract implements the SIP-010 fungible token standard with additional features:

- Fixed maximum supply
- Configurable metadata (name, symbol, decimals, URI)
- Multi-transfer utility functions
- Ownership management

### DEX Contract

The DEX contract implements the bonding curve mechanism:

- Constant product formula (x \* y = k)
- Virtual balance support for initial liquidity
- Buy/sell functions with slippage protection
- 2% transaction fee
- Automatic completion when target STX is reached
- Configurable token burning and distribution

## Configuration Parameters

Key parameters for the bonding curve:

```clarity
- TOKEN_SUPPLY: Total token supply (with decimals)
- STX_TARGET_AMOUNT: Target STX amount for completion
- VIRTUAL_STX_VALUE: Initial virtual STX balance (1/5 of target)
- COMPLETE_FEE: Fee paid upon completion (2% of target)
- BURN_PERCENT: Percentage of tokens to burn at completion
- DEPLOYER_PERCENT: Percentage of burn amount for deployer
```

## TypeScript Utilities

### Token Management

1. `exec-bonding.ts`: Generate token and DEX contracts

```bash
ts-node src/stacks-stxcity/exec-bonding.ts <token_symbol> <token_name> <token_max_supply> <token_decimals> <token_uri> <creator>
```

### Trading Operations

1. `exec-buy.ts`: Execute token purchase

```bash
ts-node src/stacks-stxcity/exec-buy.ts <stx_amount> <dex_contract_id> <token_contract_id> <token_symbol> [slippage]
```

2. `exec-sell.ts`: Execute token sale

```bash
ts-node src/stacks-stxcity/exec-sell.ts <token_amount> <dex_contract_id> <token_contract_id> <token_symbol> [slippage]
```

### Information Retrieval

1. `exec-search.ts`: Search for tokens

```bash
ts-node src/stacks-stxcity/exec-search.ts [keyword] [token_contract]
```

2. `exec-list.ts`: List all bonding tokens

```bash
ts-node src/stacks-stxcity/exec-list.ts
```

3. `exec-check.ts`: Validate bonding token

```bash
ts-node src/stacks-stxcity/exec-check.ts <dex_contract_id> <token_contract_id>
```

## Token Distribution

The implementation follows this distribution model:

- DEX Pool: ~93.5% of supply
- Owner: ~6.5% of supply
- Initial DEX STX: 27.6 STX

## Fee Structure

- Trading Fee: 2% per transaction
- Completion Fee: 40 STX (2% of target)
- Distribution:
  - 20% token burn at completion
  - 10% of burn amount to deployer
  - Remaining tokens to AMM

## Usage Example

1. Generate contracts:

```bash
ts-node src/stacks-stxcity/exec-bonding.ts MYTOKEN "My Token" 1000000000000 6 "https://token-uri.json" SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9
```

2. Deploy contracts and initialize DEX

3. Buy tokens:

```bash
ts-node src/stacks-stxcity/exec-buy.ts 100000000 SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.mytoken-stxcity-dex SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.mytoken MYTOKEN
```

## Dependencies

- stxcity-sdk: SDK for interacting with STX.CITY contracts
- eta: Template engine for contract generation
- Configuration from parent project's utilities

## Security Considerations

- Always use appropriate slippage protection
- Verify contract addresses before transactions
- Test with small amounts first
- Monitor STX balance for transaction fees

## Additional Resources

- [STX.CITY Documentation](https://docs.stx.city)
- [SIP-010 Standard](https://github.com/stacksgov/sips/blob/main/sips/sip-010/sip-010-fungible-token-standard.md)
- [Stacks Documentation](https://docs.stacks.co)
