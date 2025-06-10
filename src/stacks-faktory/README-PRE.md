# Faktory Pre-Launch Tools

A collection of command-line tools for managing pre-launch seat purchases for both Meme Tokens and AI DAOs. These tools handle seat buying, refunding, token claiming, and status monitoring during the pre-launch phase.

## Installation

```bash
npm install @faktoryfun/core-sdk @stacks/transactions
```

## Pre-Launch Overview

Pre-launch contracts allow users to buy "seats" with sBTC before the main DEX opens. The system supports two types of tokens with different pricing:

### Contract Types

#### Meme Tokens

- **Seat Price**: 0.00069000 BTC (69,000 satoshis) per seat
- **Token Allocation**: 20% of supply to pre-launch (200M tokens for 1B supply)
- **Tokens per Seat**: 10M tokens per seat (200M ÷ 20 seats)

#### AI DAOs

- **Seat Price**: 0.00020000 BTC (20,000 satoshis) per seat
- **Token Allocation**: 4% of supply to pre-launch (40M tokens for 1B supply)
- **Tokens per Seat**: 2M tokens per seat (40M ÷ 20 seats)

### Key Features

- **Seat Purchase**: Buy 1-7 seats per user during pre-launch
- **Refund**: Get full refund before distribution starts
- **Claim**: Claim vested tokens after launch with scheduled releases
- **Fee Distribution**: Earn fees from DEX trading based on seat ownership

## Available Tools

### 1. Buy Pre-Launch Seats

Purchase seats during the pre-launch phase.

```bash
bun run src/stacks-faktory/exec-buy-seats.ts <seat_count> <prelaunch_contract> [contract_type]
```

Parameters:

- `seat_count`: Number of seats to purchase (1-7 per user)
- `prelaunch_contract`: Pre-launch contract identifier
- `contract_type`: Contract type "meme" or "dao" (optional, auto-detected if omitted)

Example:

```bash
# Buy seats for Meme Token (69,000 sats per seat)
bun run src/stacks-faktory/exec-buy-seats.ts 3 "SPV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RCJDC22.fakfun-pre-faktory" meme

# Buy seats for AI DAO (20,000 sats per seat)
bun run src/stacks-faktory/exec-buy-seats.ts 5 "SPV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RCJDC22.aidao-pre-faktory" dao

# Auto-detect contract type
bun run src/stacks-faktory/exec-buy-seats.ts 2 "SPV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RCJDC22.fakfun-pre-faktory"
```

### 2. Refund Pre-Launch Seats

Get a full refund of all purchased seats before distribution starts.

```bash
bun run src/stacks-faktory/exec-refund.ts <prelaunch_contract> [contract_type]
```

Parameters:

- `prelaunch_contract`: Pre-launch contract identifier
- `contract_type`: Contract type "meme" or "dao" (optional, auto-detected if omitted)

Example:

```bash
# Refund Meme Token seats
bun run src/stacks-faktory/exec-refund.ts "SPV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RCJDC22.fakfun-pre-faktory" meme

# Refund AI DAO seats
bun run src/stacks-faktory/exec-refund.ts "SPV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RCJDC22.aidao-pre-faktory" dao

# Auto-detect contract type
bun run src/stacks-faktory/exec-refund.ts "SPV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RCJDC22.fakfun-pre-faktory"
```

### 3. Claim Vested Tokens

Claim vested tokens after distribution starts.

```bash
bun run src/stacks-faktory/exec-claim.ts <prelaunch_contract> <token_contract>
```

Parameters:

- `prelaunch_contract`: Pre-launch contract identifier
- `token_contract`: Token contract identifier

Example:

```bash
# Claim vested tokens
bun run src/stacks-faktory/exec-claim.ts "SPV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RCJDC22.fakfun-pre-faktory" "SPV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RCJDC22.fakfun-faktory"
```

### 4. Check Pre-Launch Status

Get comprehensive status information about a pre-launch contract.

```bash
bun run src/stacks-faktory/prelaunch-status.ts <prelaunch_contract>
```

Parameters:

- `prelaunch_contract`: Pre-launch contract identifier

Example:

```bash
# Check pre-launch status
bun run src/stacks-faktory/prelaunch-status.ts "SPV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RCJDC22.fakfun-pre-faktory"
```

The tool will display:

- Contract information (distribution status, total users, seats taken)
- User information (seats owned, tokens claimed, claimable amount)
- Market information (remaining seats, max allowed, pricing)
- All seat holders and their seat counts

## Contract Naming Convention

Pre-launch contracts follow this pattern:

```
{BASE_ADDRESS}.{symbol-lowercase}-pre-faktory
```

Examples:

- Meme: `SPV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RCJDC22.fakfun-pre-faktory`
- DAO: `SPV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RCJDC22.aidao-pre-faktory`

## Cost Comparison

| Contract Type  | Seat Price (BTC) | Seat Price (Sats) | 3 Seats Cost   | 7 Seats Cost   |
| -------------- | ---------------- | ----------------- | -------------- | -------------- |
| **Meme Token** | 0.00069000       | 69,000            | 0.00207000 BTC | 0.00483000 BTC |
| **AI DAO**     | 0.00020000       | 20,000            | 0.00060000 BTC | 0.00140000 BTC |

## Token Allocation Comparison

| Contract Type  | Pre-launch % | Tokens/Seat (1B supply) | Total Pre-launch |
| -------------- | ------------ | ----------------------- | ---------------- |
| **Meme Token** | 20%          | 10M tokens              | 200M tokens      |
| **AI DAO**     | 4%           | 2M tokens               | 40M tokens       |

## Vesting Schedule

Both contract types use the same vesting schedule:

- **10%** at initial unlock (height +100)
- **20%** across 6 releases (heights +250 to +1000)
- **30%** across 7 releases (heights +1200 to +2100)
- **40%** across 7 releases (heights +2500 to +4200)

**Accelerated Vesting**: If token graduates to bonding curve, first 60% (entries 0-13) unlock immediately.

## Fee Distribution System

Seat holders automatically receive a share of DEX trading fees:

- **Cooldown Period**: 2,100 blocks between airdrops
- **Pro-rata Distribution**: Fees split based on seat ownership percentage
- **Automatic Triggering**: Anyone can call `trigger-fee-airdrop` when conditions met
- **Final Mode**: After graduation, shorter cooldown for remaining fees

## Integration Flow

### 1. Pre-Launch Phase

1. **Check Status**: Use status tool to see current state and pricing
2. **Buy Seats**: Purchase seats with correct contract type
3. **Monitor**: Track seat ownership and remaining seats
4. **Refund Option**: Get full refund if needed before distribution starts

### 2. Distribution Phase (After Launch)

1. **Claim Tokens**: Claim vested tokens as they unlock
2. **Scheduled Claims**: Continue claiming as more tokens vest
3. **Fee Distribution**: Automatically receive trading fee airdrops

## Important Notes

### Pre-Launch Specifics

1. **Contract Types**: Two types with different pricing:

   - **Meme Tokens**: 69,000 satoshis (0.00069000 BTC) per seat
   - **AI DAOs**: 20,000 satoshis (0.00020000 BTC) per seat

2. **Seat Limits**:

   - 1-7 seats per user maximum
   - 20 seats total per contract
   - Minimum 10 users required before distribution

3. **Auto-Detection**: Tools can automatically detect contract type from name patterns

4. **Vesting**: Tokens vest over time with potential acceleration if token graduates

5. **Fee Distribution**: Seat holders automatically receive trading fee airdrops

6. **Refund Policy**: Full refunds available only before distribution starts

### Environment Setup

Required .env file settings:

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
- Verify contract formats and states
- Display detailed error messages with context

Common errors and solutions:

1. **"Pre-launch period has ended"**: Distribution has started, use claim instead
2. **"Cannot buy X seats"**: Check seat limits and availability
3. **"Cannot refund after distribution"**: Refunds only work before distribution
4. **"No seats owned to refund"**: User has no seats to refund
5. **"No tokens available to claim"**: No tokens have vested yet

## Security Considerations

1. **Contract Type Validation**: Always verify you're using the correct pricing
2. **Distribution Check**: Verify distribution status before operations
3. **Seat Limits**: Respect the 7-seat maximum per user limit
4. **Cost Verification**: Double-check seat costs before transactions
5. **Status Monitoring**: Check contract status before each operation

## License

These tools are provided under the MIT License. Use at your own risk.
