# Faktory Agent Tools

A collection of command-line tools for interacting with Faktory tokens and DEX contracts. These tools provide functionality for viewing DAO tokens, getting price quotes, and executing trades.

## Installation

```bash
npm install @faktoryfun/core-sdk @stacks/transactions
```

## Available Tools

### 1. List DAO Tokens

Get a paginated list of DAO tokens with optional search and sorting.

```bash
bun run src/stacks-faktory/get-dao-tokens.ts [page] [limit] [search] [sortOrder]
```

Parameters:

- `page`: Page number (optional, default: 1)
- `limit`: Number of items per page (optional, default: 10)
- `search`: Search term (optional)
- `sortOrder`: Sort order, "asc" or "desc" (optional)

Example:

```bash
# Basic usage (page 1, limit 10)
bun run src/stacks-faktory/get-dao-tokens.ts

# With specific page and limit
bun run src/stacks-faktory/get-dao-tokens.ts 1 20

# With search
bun run src/stacks-faktory/get-dao-tokens.ts 1 20 "bitcoin"
```

### 2. Get Buy Quote

Get a price quote and transaction parameters for buying tokens.

```bash
bun run src/stacks-faktory/get-buy-quote.ts <stx_amount> <dex_contract> [slippage]
```

Parameters:

- `stx_amount`: Amount of STX to spend (in STX, not microSTX)
- `dex_contract`: DEX contract identifier
- `slippage`: Maximum allowed slippage in percentage (optional, default: 15%)

Example:

```bash
# Buy quote for external DEX (TCORN)
bun run src/stacks-faktory/get-buy-quote.ts 100 "SP2XCME6ED8RERGR9R7YDZW7CA6G3F113Y8JMVA46.tcorn-stxcity-dex" 15

# Buy quote for internal DEX (BAI)
bun run src/stacks-faktory/get-buy-quote.ts 100 "SPV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RCJDC22.bai-faktory-dex" 15
```

### 3. Get Sell Quote

Get a price quote and transaction parameters for selling tokens.

```bash
bun run src/stacks-faktory/get-sell-quote.ts <token_amount> <dex_contract> [slippage]
```

Parameters:

- `token_amount`: Amount of tokens to sell
- `dex_contract`: DEX contract identifier
- `slippage`: Maximum allowed slippage in percentage (optional, default: 15%)

Example:

```bash
# Sell quote for external DEX (TCORN)
bun run src/stacks-faktory/get-sell-quote.ts 100000 "SP2XCME6ED8RERGR9R7YDZW7CA6G3F113Y8JMVA46.tcorn-stxcity-dex" 15

# Sell quote for internal DEX (BAI)
bun run src/stacks-faktory/get-sell-quote.ts 100000 "SPV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RCJDC22.bai-faktory-dex" 15
```

### 4. Execute Buy

Execute a buy transaction for tokens.

```bash
bun run src/stacks-faktory/exec-buy.ts <stx_amount> <dex_contract> [slippage]
```

Parameters:

- `stx_amount`: Amount of STX to spend (in STX, not microSTX)
- `dex_contract`: DEX contract identifier
- `slippage`: Maximum allowed slippage in percentage (optional, default: 15%)

Example:

```bash
# Buy from external DEX (TCORN)
bun run src/stacks-faktory/exec-buy.ts 1 "SP2XCME6ED8RERGR9R7YDZW7CA6G3F113Y8JMVA46.tcorn-stxcity-dex" 15

# Buy from internal DEX (BAI)
bun run src/stacks-faktory/exec-buy.ts 1 "SPV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RCJDC22.bai-faktory-dex" 15
```

### 5. Execute Sell

Execute a sell transaction for tokens.

```bash
bun run src/stacks-faktory/exec-sell.ts <token_amount> <dex_contract> [slippage]
```

Parameters:

- `token_amount`: Amount of tokens to sell
- `dex_contract`: DEX contract identifier
- `slippage`: Maximum allowed slippage in percentage (optional, default: 15%)

Example:

```bash
# Sell to external DEX (TCORN)
bun run src/stacks-faktory/exec-sell.ts 1000 "SP2XCME6ED8RERGR9R7YDZW7CA6G3F113Y8JMVA46.tcorn-stxcity-dex" 15

# Sell to internal DEX (BAI)
bun run src/stacks-faktory/exec-sell.ts 1000 "SPV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RCJDC22.bai-faktory-dex" 15
```

### 6. Get a single Token

Get details about a specific token by its DEX contract.

```bash
bun run src/stacks-faktory/get-token.ts <dex_contract>
```

Parameters:

dex_contract: DEX contract identifier

Example:

```bash
# Get token info (TCORN)
bun run src/stacks-faktory/get-token.ts "SP2XCME6ED8RERGR9R7YDZW7CA6G3F113Y8JMVA46.tcorn-stxcity-dex"

# Get token info (BAI)
bun run src/stacks-faktory/get-token.ts "SPV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RCJDC22.bai-faktory-dex"
```

### 7. Get Token Trades

Get the most recent trading history (last 100 trades) for a specific token, including trade statistics and aggregated data.

```bash
bun run src/stacks-faktory/get-token-trades.ts <token_contract>
```

Parameters:

- `token_contract`: Token contract identifier (the contract for the token itself, not the DEX)

Example:

```bash
# Get last 100 trades for AGENTX
bun run src/stacks-faktory/get-token-trades.ts SP2XCME6ED8RERGR9R7YDZW7CA6G3F113Y8JMVA46.agentx-faktory
```

The tool will display:

- Most recent 100 trades
- Latest trade details (timestamp, type, amounts, price)
- Aggregate statistics for these trades:
  - Buy count
  - Sell count
  - Total trading volume in STX
  - Average price
  - Total tokens traded

Note: The token amounts displayed are automatically adjusted using the correct decimal places for the specific token. Statistics are calculated based on the last 100 trades only.

## Important Notes

1. **Slippage**: All tools use percentage-based slippage:

   - 15 means 15% slippage (default)
   - 5 means 5% slippage
   - 0.5 means 0.5% slippage

2. **STX Amounts**: Use whole STX units (not microSTX):

   - Use 100 for 100 STX
   - Tools automatically convert to microSTX (100 \* 1,000,000)

3. **DEX Contracts**: Always use the full DEX contract identifier:

   - External DEX example: "SP2XCME6ED8RERGR9R7YDZW7CA6G3F113Y8JMVA46.tcorn-stxcity-dex"
   - Internal DEX example: "SPV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RCJDC22.bai-faktory-dex"

4. **Environment**: Required .env file settings:
   ```
   NETWORK=mainnet
   MNEMONIC=your_mnemonic_here
   ACCOUNT_INDEX=0
   HIRO_API_KEY=your_api_key_here
   ```

## Error Handling

The tools include comprehensive error handling and will:

- Validate all required parameters
- Check for proper numeric values
- Verify contract formats
- Display detailed error messages

If you encounter errors, check:

1. Parameter formats and values
2. Network connection
3. Account balance and token allowances
4. Contract addresses and identifiers

## License

These tools are provided under the MIT License. Use at your own risk.
