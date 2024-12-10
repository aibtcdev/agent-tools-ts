# Jing Trading Agent Tools

Command line tools for interacting with Jing.Cash markets on Stacks. These tools enable programmatic interaction with Jing's on-chain orderbooks for spot trading, private offers, and market monitoring.

## Features

- Full support for Jing's spot trading functionality
- Real-time market monitoring and order tracking
- Private P2P offer creation and management
- Automatic handling of token decimals and unit conversion
- Order expiration handling
- Comprehensive post-conditions for safe execution
- Detailed console output showing both regular and micro units
- Price per token calculations with proper decimal handling

## Installation

```bash
npm install @jingcash/core-sdk
```

## Configuration

Create a `.env` file in your project root:

```bash
# API access (will be provided by Jing.Cash)
JING_API_URL=<api_url>
JING_API_KEY=<api_key>

# Network and account settings
NETWORK=mainnet
MNEMONIC=<your_seed_phrase>
ACCOUNT_INDEX=0
```

## Available Tools

### Market Data Tools
- `get-market.ts` - Get live order book for a trading pair
- `get-private-offers.ts` - View offers exclusively sent to your address
- `get-user-offers.ts` - Track your open orders in a market
- `get-pending-orders.ts` - Monitor all pending orders across Stacks markets

### Trading Operations
- `bid.ts` - Create a new bid order
- `ask.ts` - Create a new ask order 
- `submit-bid.ts` - Submit swap for an existing bid
- `submit-ask.ts` - Submit swap for an existing ask
- `cancel-bid.ts` - Cancel an existing bid
- `cancel-ask.ts` - Cancel an existing ask
- `reprice-bid.ts` - Update price of existing bid
- `reprice-ask.ts` - Update price of existing ask
- `get-bid.ts` - Get details of existing bid
- `get-ask.ts` - Get details of existing ask

### Utilities
- `utils-token-pairs.ts` - Contract addresses, decimal handling, and helper functions for supported fungible tokens trading against STX

## Usage Examples

### Market Monitoring

```bash
# Get order book for a trading pair
bun run src/jing/get-market.ts PEPE-STX

# View your private offers
bun run src/jing/get-private-offers.ts PEPE-STX SP2...

# Check your open orders
bun run src/jing/get-user-offers.ts PEPE-STX SP2...

# Monitor all pending orders
bun run src/jing/get-pending-orders.ts
```

### Creating Orders

```bash
# Create bid: <pair> <token_amount> <stx_amount>
bun run src/jing/bid.ts PEPE-STX 100000 1.5  # Bid 1.5 STX for 100000 PEPE

# Create ask: <pair> <token_amount> <stx_amount>
bun run src/jing/ask.ts PEPE-STX 100000 1.5  # Ask 1.5 STX for 100000 PEPE

# Create private offer with expiry: <pair> <amount> <stx_amount> <recipient> <blocks_until_expiry>
bun run src/jing/ask.ts PEPE-STX 100000 1.5 SP29D6YMDNAKN1P045T6Z817RTE1AC0JAA99WAX2B 1000
```

### Managing Orders

```bash
# Get order details: <swap_id>
bun run src/jing/get-bid.ts 0
bun run src/jing/get-ask.ts 1

# Cancel order: <swap_id> <pair>
bun run src/jing/cancel-bid.ts 13 PEPE-STX
bun run src/jing/cancel-ask.ts 13 PEPE-STX

# Reprice bid: <swap_id> <new_token_amount> <pair>
bun run src/jing/reprice-bid.ts 1 150000 PEPE-STX  # Change bid to 150000 PEPE

# Reprice ask: <swap_id> <new_stx_amount> <pair>
bun run src/jing/reprice-ask.ts 4 2.5 PEPE-STX    # Change ask price to 2.5 STX

# Reprice with private offer: <swap_id> <new_amount> <pair> <recipient> <blocks_until_expiry>
bun run src/jing/reprice-ask.ts 5 2.5 PEPE-STX SPV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RCJDC22 100
```

### Example Outputs

```bash
# get-market.ts output
Order Book for PEPE-STX:
Bids:
  - 100,000 PEPE @ 0.0015 STX/PEPE
  - 50,000 PEPE @ 0.0014 STX/PEPE
Asks:
  - 75,000 PEPE @ 0.0016 STX/PEPE
  - 200,000 PEPE @ 0.0017 STX/PEPE

# get-pending-orders.ts output
Total Pending Orders: 15
Processing Orders:
  - PEPE-STX: Buy 100,000 PEPE @ 0.0015 STX
  - aBTC-STX: Sell 0.1 aBTC @ 35000 STX

# get-private-offers.ts output
Private Offers for SP2K3...TZ:
Received Bids:
  - Bid #123: 50,000 PEPE @ 0.0016 STX/PEPE
Received Asks:
  - Ask #456: 25,000 PEPE @ 0.0014 STX/PEPE

# get-user-offers.ts output
Your Open Orders:
Active Bids:
  - Bid #789: 100,000 PEPE @ 0.0015 STX/PEPE
Active Asks:
  - Ask #101: 75,000 PEPE @ 0.0017 STX/PEPE
```

## Important Notes

- Amounts can be entered in regular units (e.g., 1.5 STX instead of 1500000 μSTX)
- Token decimals are automatically fetched from contracts
- Scripts show both regular and micro units in output for clarity
- Fast transaction confirmation times observed in testing
- Expiry is specified as number of blocks from current height
- Private P2P offers enable MEV-free trading

## Testing Status

✅ Order book monitoring  
✅ Private offer tracking  
✅ User offer management  
✅ Order creation (bids/asks)  
✅ Order management (get/cancel/reprice)  
✅ Trade execution (submit swaps)  
✅ Private offers with expiration  
✅ Various token pairs (PEPE, aBTC, FAIR tested)  
✅ Decimal handling for different token standards

## Links

- [Jing.Cash](https://app.jing.cash)
- [Core SDK Documentation](https://www.npmjs.com/package/@jingcash/core-sdk)
- [GitHub Repository](https://github.com/JingCash/core-sdk)
