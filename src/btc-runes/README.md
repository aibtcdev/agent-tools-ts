# Runes Etching Tools

A command-line tool for etching runes tokens on Bitcoin using the OrdinalsBot API. This tool provides functionality for creating runes with 100% premine and sending them directly to a specified address.

## Installation

```bash
npm install ordinalsbot dotenv
```

## Available Tool

### Etch Runes Token

Create a new runes token with 100% of supply premined and sent to a specified address.

```bash
bun run src/bitcoin-runes/etch-runes.ts <rune_name> <supply> <symbol> [network]
```

Parameters:

- `rune_name`: Name of the rune (required)
- `supply`: Total supply of tokens (required)
- `symbol`: Single character symbol (required)
- `network`: Network to use (optional, default: "testnet")

Example:

```bash
# Basic usage (on testnet)
bun run src/bitcoin-runes/etch-runes.ts "FAKTORY•TOKEN" 21000000 "K"

# Specify network
bun run src/bitcoin-runes/etch-runes.ts "FAKTORY•TOKEN" 21000000 "K" mainnet
```

## Important Notes

1. **Environment Setup**: Required .env file settings:

   ```
   ORDINALSBOT_API_KEY=your_api_key_here
   RECEIVE_ADDRESS=your_receive_address_here
   ```

2. **Rune Names**:

   - Can include special characters like "•"
   - Names become available over time (refer to official documentation)
   - Currently available on testnet only until block height 840000

3. **Network Options**:

   - "testnet" (default)
   - "mainnet"

4. **Technical Details**:
   - All runes are created with 100% premine
   - Default divisibility is set to 8 decimal places
   - Includes turbo mode for faster processing
   - Default fee is set to 510 sats
   - File inscription is handled automatically

## Response Format

The tool will display:

- Configuration details
- Order creation status
- Order ID
- Order tracking information

Example output:

```
Rune Configuration:
------------------
Network: testnet
Rune Name: FAKTORY•TOKEN
Supply: 21,000,000
Symbol: K
Receive Address: tb1...
------------------

Creating runes etching order...
Order created successfully!
------------------
[Order details will appear here]

Tracking order status for ID: [order_id]
Current order status: [status]
```

## Error Handling

The tool includes comprehensive error handling for:

- Missing or invalid parameters
- Missing environment variables
- API errors
- Network issues

If you encounter errors, check:

1. Environment variables are set correctly
2. Parameters are in the correct format
3. Network connection
4. OrdinalsBot API status

## Technical Requirements

- Node.js v16 or higher
- Bun runtime
- Valid OrdinalsBot API key
- Valid Bitcoin address for receiving the runes

## Response States

Orders go through the following states:

1. "waiting-payment"
2. "waiting-reveal" (after payment)
3. "completed" (after six block confirmations)

Note: Rune orders take six blocks due to the commit-reveal protocol.

## License

This tool is provided under the MIT License. Use at your own risk.
