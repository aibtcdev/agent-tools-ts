# DAO SDK

A TypeScript SDK for interacting with DAOs and their extensions on the Stacks blockchain. This SDK provides a comprehensive set of tools for deploying, managing, and interacting with DAO contracts.

## Features

- 🏗️ Contract Generation & Deployment
- 🔍 Contract Discovery
- 📝 Smart Contract Interaction
- 🔐 Secure Transaction Handling
- 🌐 Multi-Network Support
- 🧩 Extension Management

## Installation

```bash
npm install @aibtcdev/dao-sdk
# or
yarn add @aibtcdev/dao-sdk
```

## Quick Start

```typescript
import { DaoSDK } from "@aibtcdev/dao-sdk";

// Initialize the SDK
const sdk = new DaoSDK({
  network: "mainnet", // or 'testnet'
  stacksApi: "https://api.mainnet.hiro.so",
});

// Generate and deploy a DAO
async function deployDao() {
  // First generate the contract
  const generatedDao = await sdk.executor.generate({
    name: "MyDAO",
    extensions: [],
    includeDeployer: true,
  });

  // Then deploy it
  const deployedDao = await sdk.executor.deploy({
    name: "MyDAO",
    contractName: "my-dao-v1",
    extensions: [],
    includeDeployer: true,
    senderKey: "YOUR_PRIVATE_KEY",
    fee: 10000,
  });

  console.log("Deployed DAO:", deployedDao);
}
```

## Components

### Executor (Core DAO)

The main DAO contract that manages extensions and executes proposals.

```typescript
// Find existing executors
const executors = await sdk.executor.findAll();

// Deploy a new executor
const executor = await sdk.executor.deploy({
  name: "MyDAO",
  contractName: "my-dao",
  senderKey: "YOUR_PRIVATE_KEY",
});

// Set an extension
await sdk.executor.setExtension(executorId, extensionId, true, {
  senderKey: "YOUR_PRIVATE_KEY",
});
```

### Treasury

Manages DAO assets including STX, NFTs, and fungible tokens.

```typescript
// Deploy a treasury extension
const treasury = await sdk.treasury.deploy({
  name: "MyTreasury",
  daoContractId: "SP...",
  extensionTraitContractId: "SP...",
  sip009TraitContractId: "SP...",
  sip010TraitContractId: "SP...",
  senderKey: "YOUR_PRIVATE_KEY",
});

// Deposit STX
await sdk.treasury.depositStx(
  treasuryId,
  1000000, // amount in microSTX
  { senderKey: "YOUR_PRIVATE_KEY" }
);
```

### Bank Account

Manages recurring payments and withdrawals.

```typescript
// Deploy a bank account extension
const bank = await sdk.bankAccount.deploy({
  name: "MyBank",
  daoContractId: "SP...",
  extensionTraitContractId: "SP...",
  defaultWithdrawalPeriod: 144,
  defaultWithdrawalAmount: 1000000,
  senderKey: "YOUR_PRIVATE_KEY",
});

// Update terms
await sdk.bankAccount.updateTerms(
  bankId,
  {
    withdrawalPeriod: 288,
    withdrawalAmount: 2000000,
  },
  { senderKey: "YOUR_PRIVATE_KEY" }
);
```

### Payments

Handles payment processing and resource management.

```typescript
// Deploy a payments extension
const payments = await sdk.payments.deploy({
  name: "MyPayments",
  daoContractId: "SP...",
  extensionTraitContractId: "SP...",
  paymentTraitsContractId: "SP...",
  senderKey: "YOUR_PRIVATE_KEY",
});

// Add a resource
await sdk.payments.addResource(
  paymentsId,
  "Premium",
  "Premium access",
  100000000,
  { senderKey: "YOUR_PRIVATE_KEY" }
);
```

### Messaging

Handles on-chain messaging and notifications.

```typescript
// Deploy a messaging extension
const messaging = await sdk.messaging.deploy({
  name: "MyMessaging",
  extensionTraitContractId: "SP...",
  senderKey: "YOUR_PRIVATE_KEY",
});

// Send a message
await sdk.messaging.send(messagingId, "Hello DAO members!", {
  senderKey: "YOUR_PRIVATE_KEY",
});
```

## Contract Discovery

Find contracts by their implemented traits:

```typescript
// Find all executors
const executors = await sdk.executor.findAll();

// Find all treasuries
const treasuries = await sdk.treasury.findAll();
```

## Error Handling

The SDK provides detailed error information:

```typescript
try {
  await sdk.executor.deploy({
    // ... options
  });
} catch (error) {
  if (error.message.includes("insufficient funds")) {
    console.error("Not enough STX to deploy contract");
  } else {
    console.error("Deployment failed:", error);
  }
}
```

## Configuration

The SDK can be configured with various options:

```typescript
const sdk = new DaoSDK({
  // Required
  network: "mainnet", // or 'testnet'

  // Optional
  baseUrl: "YOUR_API_URL", // Default: http://localhost:3000/api
  stacksApi: "YOUR_STACKS_API_URL", // Default: https://api.mainnet.hiro.so
});
```

## Testing

```bash
# Run all tests
bun test

# Run specific test file
bun test tests/executor.test.ts
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@your-org.com or join our Discord community.
