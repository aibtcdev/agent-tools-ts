## Pre-Launch Tools

Faktory's pre-launch system allows early participants to buy seats before token deployment. Seat holders receive vested tokens and participate in fee distribution from the DEX.

**Network Support**: All pre-launch tools work on both **mainnet** and **testnet**. The SDK automatically detects your network configuration from the `.env` file and uses the appropriate contracts and endpoints.

### 8. Buy Pre-Launch Seats

Purchase seats in a pre-launch offering. Each seat costs a fixed amount (typically 0.0002 BTC for DAO tokens) and provides vested token allocation.

```bash
bun run src/stacks-faktory/exec-buy-seats.ts <seat_count> <prelaunch_contract> [contract_type]
```

Parameters:

- `seat_count`: Number of seats to purchase (1-7 per user)
- `prelaunch_contract`: Pre-launch contract identifier
- `contract_type`: "dao", "meme", or "helico" (optional, default: "dao")

Example:

```bash
# Buy 3 seats in a DAO pre-launch
bun run src/stacks-faktory/exec-buy-seats.ts 3 STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.simpl1-pre-faktory dao
```

**Seat Pricing:**

- **DAO tokens**: 0.00020000 BTC per seat (20 seats total, 10 users minimum)
- **Meme tokens**: 0.00069000 BTC per seat (20 seats total, 10 users minimum)
- **Helico tokens**: 0.00006900 BTC per seat (200 seats total, 100 users minimum)

### 9. Refund Pre-Launch Seats

Refund your seats before the pre-launch completes and distribution begins.

```bash
bun run src/stacks-faktory/exec-refund.ts <prelaunch_contract> [contract_type]
```

Parameters:

- `prelaunch_contract`: Pre-launch contract identifier
- `contract_type`: "dao", "meme", or "helico" (optional, default: "dao")

Example:

```bash
# Refund all seats from a DAO pre-launch
bun run src/stacks-faktory/exec-refund.ts STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.simpl1-pre-faktory dao
```

### 10. Claim Vested Tokens

Claim your vested tokens from a completed pre-launch. Tokens vest over time according to a predetermined schedule.

```bash
bun run src/stacks-faktory/exec-claim.ts <prelaunch_contract> <token_contract>
```

Parameters:

- `prelaunch_contract`: Pre-launch contract identifier
- `token_contract`: Token contract identifier

Example:

```bash
# Claim vested tokens from completed pre-launch
bun run src/stacks-faktory/exec-claim.ts STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.simpl1-pre-faktory STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.simpl1-faktory
```

**Vesting Schedule:**

- **10%** available immediately after pre-launch completion
- **90%** vested over time through multiple unlock periods
- Tokens can be claimed as they vest
- Accelerated vesting if token graduates to bonding curve

### 11. Trigger Fee Airdrop

Trigger distribution of accumulated DEX fees to all seat holders. Anyone can call this function when conditions are met.

```bash
bun run src/stacks-faktory/exec-trigger-fee-airdrop.ts <prelaunch_contract>
```

Parameters:

- `prelaunch_contract`: Pre-launch contract identifier

Example:

```bash
# Trigger fee distribution to seat holders
bun run src/stacks-faktory/exec-trigger-fee-airdrop.ts STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.simpl1-pre-faktory
```

**Fee Distribution:**

- Accumulated trading fees from the DEX are distributed proportionally to seat holders
- Anyone can trigger the airdrop when cooldown period expires
- Fees are distributed based on seat ownership percentage

### 12. Check Market Status

Check if the DEX market is open and trading is active (indicates pre-launch completion).

```bash
bun run src/stacks-faktory/get-is-market-open.ts <prelaunch_contract>
```

Parameters:

- `prelaunch_contract`: Pre-launch contract identifier

Example:

```bash
# Check if market/DEX is open for trading
bun run src/stacks-faktory/get-is-market-open.ts STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.simpl1-pre-faktory
```

Returns `true` if the pre-launch is complete and DEX trading is active.

## Pre-Launch Process Flow

1. **Pre-Launch Phase**: Users buy seats with sBTC
2. **Completion**: When minimum users (10) and total seats (20) are reached
3. **Distribution Setup**: 40M tokens allocated to pre-launch contract for vesting
4. **DEX Activation**: Remaining tokens and sBTC sent to DEX for trading
5. **Vesting**: Seat holders claim tokens according to vesting schedule
6. **Fee Sharing**: Ongoing DEX fees distributed to seat holders

## Pre-Launch Important Notes

1. **Network Support**: Works on both mainnet and testnet - SDK auto-detects from `.env` configuration

2. **sBTC Required**: All pre-launch transactions use sBTC (Stacks-wrapped Bitcoin)

3. **Seat Limits**: Maximum 7 seats per user across all pre-launch types

4. **Completion Requirements**:

   - DAO/Meme: 10 users + 20 seats filled
   - Helico: 100 users + 200 seats filled

5. **No Refunds**: After pre-launch completes and distribution begins, seats cannot be refunded

6. **Contract Addresses**: Use the pre-launch contract for seat operations, token contract for claiming

7. **Fee Airdrops**: Separate from token vesting - represents ongoing DEX revenue sharing

8. **Mainnet vs Testnet**: Simply change `NETWORK=mainnet` or `NETWORK=testnet` in `.env` - all tools work identically
