# Faktory Agent Tools

A collection of command-line tools for interacting with Faktory tokens and DEX contracts. These tools provide functionality for viewing DAO tokens, getting price quotes, and executing trades for both STX and BTC denominated tokens.

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

Get a price quote and transaction parameters for buying tokens. Works with both STX and BTC denominated tokens.

```bash
bun run src/stacks-faktory/get-buy-quote.ts <amount> <dex_contract> [slippage]
```

Parameters:

- `amount`: Amount to spend (in STX or BTC units depending on token denomination)
- `dex_contract`: DEX contract identifier
- `slippage`: Maximum allowed slippage in percentage (optional, default: 15%)

Example:

```bash
# Buy quote for STX-denominated token (TCORN)
bun run src/stacks-faktory/get-buy-quote.ts 100 "SP2XCME6ED8RERGR9R7YDZW7CA6G3F113Y8JMVA46.tcorn-stxcity-dex" 15

# Buy quote for BTC-denominated token
bun run src/stacks-faktory/get-buy-quote.ts 0.002 "STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.okbtc4-faktory-dex" 15
```

### 3. Get Sell Quote

Get a price quote and transaction parameters for selling tokens. Works with both STX and BTC denominated tokens.

```bash
bun run src/stacks-faktory/get-sell-quote.ts <token_amount> <dex_contract> [slippage]
```

Parameters:

- `token_amount`: Amount of tokens to sell
- `dex_contract`: DEX contract identifier
- `slippage`: Maximum allowed slippage in percentage (optional, default: 15%)

Example:

```bash
# Sell quote for STX-denominated token (TCORN)
bun run src/stacks-faktory/get-sell-quote.ts 100000 "SP2XCME6ED8RERGR9R7YDZW7CA6G3F113Y8JMVA46.tcorn-stxcity-dex" 15

# Sell quote for BTC-denominated token
bun run src/stacks-faktory/get-sell-quote.ts 100000 "STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.okbtc4-faktory-dex" 15
```

### 4. Execute Buy

Execute a buy transaction for tokens. Works with both STX and BTC denominated tokens.

```bash
bun run src/stacks-faktory/exec-buy.ts <amount> <dex_contract> [slippage]
```

Parameters:

- `amount`: Amount to spend (in STX or BTC units depending on token denomination)
- `dex_contract`: DEX contract identifier
- `slippage`: Maximum allowed slippage in percentage (optional, default: 15%)

Example:

```bash
# Buy STX-denominated token (TCORN)
bun run src/stacks-faktory/exec-buy.ts 1 "SP2XCME6ED8RERGR9R7YDZW7CA6G3F113Y8JMVA46.tcorn-stxcity-dex" 15

# Buy BTC-denominated token
bun run src/stacks-faktory/exec-buy.ts 0.002 "STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.okbtc4-faktory-dex" 15
```

### 5. Execute Sell

Execute a sell transaction for tokens. Works with both STX and BTC denominated tokens.

```bash
bun run src/stacks-faktory/exec-sell.ts <token_amount> <dex_contract> [slippage]
```

Parameters:

- `token_amount`: Amount of tokens to sell
- `dex_contract`: DEX contract identifier
- `slippage`: Maximum allowed slippage in percentage (optional, default: 15%)

Example:

```bash
# Sell STX-denominated token (TCORN)
bun run src/stacks-faktory/exec-sell.ts 1000 "SP2XCME6ED8RERGR9R7YDZW7CA6G3F113Y8JMVA46.tcorn-stxcity-dex" 15

# Sell BTC-denominated token
bun run src/stacks-faktory/exec-sell.ts 1000 "STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.okbtc4-faktory-dex" 15
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

# Get BTC-denominated token info
bun run src/stacks-faktory/get-token.ts "STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.okbtc4-faktory-dex"
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
  - Total trading volume in STX/BTC
  - Average price
  - Total tokens traded

Note: The token amounts displayed are automatically adjusted using the correct decimal places for the specific token. Statistics are calculated based on the last 100 trades only.

## Important Notes

1. **Slippage**: All tools use percentage-based slippage:

   - 15 means 15% slippage (default)
   - 5 means 5% slippage
   - 0.5 means 0.5% slippage

2. **Currency Amounts**: Use base units (not micro units):

   - For STX-denominated tokens: Use 100 for 100 STX (tools convert to 100 × 10^6 microSTX)
   - For BTC-denominated tokens: Use 0.002 for 0.002 BTC (tools convert to 0.002 × 10^8 satoshis)

3. **Token Denomination**: The SDK automatically detects whether a token is STX or BTC denominated:

   - The input amount is interpreted based on the token's denomination
   - For BTC-denominated tokens, use smaller amounts (e.g., 0.002 BTC = 200,000 satoshis)
   - For STX-denominated tokens, use standard STX amounts (e.g., 100 STX = 100,000,000 microSTX)

4. **DEX Contracts**: Always use the full DEX contract identifier:

   - STX DEX example: "SP2XCME6ED8RERGR9R7YDZW7CA6G3F113Y8JMVA46.tcorn-stxcity-dex"
   - BTC DEX example: "STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.okbtc4-faktory-dex"

5. **Environment**: Required .env file settings:
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
