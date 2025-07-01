# Airdrop Functionality

Bulk token distribution using the `send-many` function in DAO token contracts.

## Features

- ✅ **Equal Distribution** - Split tokens equally among recipients
- ✅ **Custom Amounts** - Different amounts per recipient
- ✅ **Auto-batching** - Handles >200 recipients automatically
- ✅ **Balance Validation** - Check before sending
- ✅ **Memo Support** - Custom messages per transfer

## SDK Methods

### `getAirdropParams(recipients, tokenContract, senderAddress)`

Core method for custom amounts per recipient.

```typescript
const params = await sdk.getAirdropParams({
  tokenContract: "ST3...slow10-faktory",
  recipients: [
    { address: "ST1ABC...", amount: 1000, memo: "Team" },
    { address: "ST2DEF...", amount: 500, memo: "Community" },
  ],
  senderAddress: "ST3...",
});
```

### `getEqualAirdropParams(walletAddresses, totalAmount, tokenContract, senderAddress)`

Helper for equal distribution.

```typescript
const params = await sdk.getEqualAirdropParams({
  tokenContract: "ST3...slow10-faktory",
  walletAddresses: ["ST1ABC...", "ST2DEF..."],
  totalAmount: 10000,
  senderAddress: "ST3...",
  memo: "Airdrop", // optional
});
```

### `validateAirdropBalance(tokenContract, senderAddress, totalAmount)`

Check if sender has enough tokens.

```typescript
const validation = await sdk.validateAirdropBalance({
  tokenContract: "ST3...slow10-faktory",
  senderAddress: "ST3...",
  totalAmount: 10000,
});

if (!validation.hasEnoughBalance) {
  console.log(`Need ${validation.shortfall} more tokens`);
}
```

## CLI Tool

```bash
# Equal distribution
bun run exec-airdrop.ts equal 75000000 recipients.json ST3...slow10-faktory

# Custom amounts
bun run exec-airdrop.ts custom custom-recipients.json ST3...slow10-faktory

# Validate only (safe)
bun run exec-airdrop.ts validate 100000 recipients.json ST3...slow10-faktory
```

### File Formats

**Equal (`recipients.json`):**

```json
["ST1ABC...", "ST2DEF...", "ST3GHI..."]
```

**Custom (`custom-recipients.json`):**

```json
[
  { "address": "ST1ABC...", "amount": 1000, "memo": "Team" },
  { "address": "ST2DEF...", "amount": 500, "memo": "Advisor" }
]
```

## Batching

For >200 recipients, the tool automatically splits into batches:

- Max 200 per transaction
- 10-second delays between batches
- Progress tracking
- Nonce management

## Contract Requirements

Your token contract needs:

```clarity
(define-public (send-many (recipients (list 200 { to: principal, amount: uint, memo: (optional (buff 34)) }))))
```

## Limits

- **200 recipients max** per `send-many` call
- **34 characters max** for memos
- **Whole numbers only** for amounts

## Examples

```bash
# Test with small amount first
bun run exec-airdrop.ts validate 1000 test-recipients.json ST3...slow10-faktory

# Run equal airdrop
bun run exec-airdrop.ts equal 1000000 recipients.json ST3...slow10-faktory

# Large airdrop (auto-batches)
bun run exec-airdrop.ts equal 10000000 large-recipients.json ST3...slow10-faktory
```

## Best Practices

1. **Always validate first** with `validate` mode
2. **Use whole numbers** that divide evenly
3. **Test small amounts** before large airdrops
4. **Keep memos short** (≤34 chars)
5. **Let tool handle batching** for >200 recipients
