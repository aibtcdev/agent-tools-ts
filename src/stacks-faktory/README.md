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
ts-node src/faktory/get-dao-tokens.ts [page] [limit] [search] [sortOrder]

bun run src/stacks-faktory/get-dao-tokens.ts
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
ts-node src/faktory/get-buy-quote.ts <stx_amount> <dex_contract> [slippage]
```

Parameters:

- `stx_amount`: Amount of STX to spend (in STX, not microSTX)
- `dex_contract`: DEX contract identifier (format: "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.ampx-v1")
- `slippage`: Maximum allowed slippage in percentage (optional, default: 15%)

Example:

# Buy 100 STX worth of TCORN

bun run src/stacks-faktory/get-buy-quote.ts 100 "SP2XCME6ED8RERGR9R7YDZW7CA6G3F113Y8JMVA46.tcorn-stxcity-dex" 15

# Sell 100 STX worth of TCORN

bun run src/stacks-faktory/get-buy-quote.ts <stx_amount> <dex_contract> [slippage] [network]
bun run src/stacks-faktory/get-sell-quote.ts <token_amount> <dex_contract> [slippage] [network]

```bash
# Get quote for buying with 100 STX, 15% slippage
bun run src/stacks-faktory/get-buy-quote.ts 100 "SP2XCME6ED8RERGR9R7YDZW7CA6G3F113Y8JMVA46.tcorn-stxcity-dex" 15

# Get quote with custom 5% slippage
ts-node src/faktory/get-buy-quote.ts 100 "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.ampx-v1" 5
```

### 3. Get Sell Quote

Get a price quote and transaction parameters for selling tokens.

```bash
# For mainnet (default)
bun run src/stacks-faktory/get-buy-quote.ts <stx_amount> <dex_contract> [slippage] [network]
bun run src/stacks-faktory/get-sell-quote.ts <token_amount> <dex_contract> [slippage] [network]

# If you need testnet

```

Parameters:

- `token_amount`: Amount of tokens to sell (in token units with decimals)
- `dex_contract`: DEX contract identifier
- `slippage`: Maximum allowed slippage in percentage (optional, default: 15%)

Example:

```bash
# Get quote for selling 1000 tokens
ts-node src/faktory/get-sell-quote.ts 1000 "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.ampx-v1"

# Get quote with custom 10% slippage
ts-node src/faktory/get-sell-quote.ts 1000 "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.ampx-v1" 10
```

### 4. Execute Buy

Execute a buy transaction for tokens.

```bash
# Buy tokens using 100 STX with 15% slippage (default)
bun run src/stacks-faktory/exec-buy.ts 100 SPV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RCJDC22.bai-faktory

# Buy tokens using 50 STX with 10% slippage
bun run src/stacks-faktory/exec-buy.ts 50 SP2XCME6ED8RERGR9R7YDZW7CA6G3F113Y8JMVA46.tcorn-stxcity 10
```

Parameters:

- `stx_amount`: Amount of STX to spend (in STX, not microSTX)
- `dex_contract`: DEX contract identifier
- `slippage`: Maximum allowed slippage in percentage (optional, default: 15%)

Example:

```bash
# Buy tokens using 1 STX with 15% slippage (default)
bun run src/stacks-faktory/exec-buy.ts 1 SP2XCME6ED8RERGR9R7YDZW7CA6G3F113Y8JMVA46.tcorn-stxcity-dex

# Buy tokens using 1 STX with 10% slippage
bun run src/stacks-faktory/exec-buy.ts 1 SPV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RCJDC22.bai-faktory-dex 10
```

### 5. Execute Sell

Execute a sell transaction for tokens.

```bash
ts-node src/faktory/exec-sell.ts <token_amount> <dex_contract> [slippage]
```

Parameters:

- `token_amount`: Amount of tokens to sell (in token units with decimals)
- `dex_contract`: DEX contract identifier
- `slippage`: Maximum allowed slippage in percentage (optional, default: 15%)

Example:

```bash
# Sell 200 tokens with 15% slippage (default)
bun run src/stacks-faktory/exec-sell.ts 200 SPV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RCJDC22.bai-faktory-dex

# Sell 500 tokens with 5% slippage
bun run src/stacks-faktory/exec-sell.ts 500 SP2XCME6ED8RERGR9R7YDZW7CA6G3F113Y8JMVA46.tcorn-stxcity-dex 5
```

## Important Notes

1. **Slippage**: All tools use percentage-based slippage (not basis points). For example:

   - 15 means 15% slippage (default)
   - 5 means 5% slippage
   - 0.5 means 0.5% slippage

2. **STX Amounts**: When providing STX amounts, use whole STX units (not microSTX):

   - Use 100 for 100 STX
   - The tools will automatically convert to microSTX (100 \* 1,000,000)

3. **Token Amounts**: Provide token amounts in their native units with decimals:

   - If a token has 6 decimals, use 1000000 for 1 token
   - Check token decimals before executing trades

4. **Contract IDs**: Always use the full contract identifier including the address and contract name:

   - Format: "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.contract-name"
   - Both DEX and token contracts follow this format

5. **Environment**: Make sure your environment variables are properly set in your `.env` file:
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
- Display detailed error messages if something goes wrong

If you encounter errors, check:

1. Parameter formats and values
2. Network connection
3. Account balance and token allowances
4. Contract addresses and identifiers

## License

These tools are provided under the MIT License. Use at your own risk.
