<img src="https://aibtc.dev/logos/aibtcdev-primary-logo-black-wide-1000px.png" alt="AIBTC Working Group Logo" style="width: 100%; max-width: 1000px; display: block; margin: 1rem auto;" />

# AIBTC Agent Tools (TypeScript)

A collection of TypeScript tools and SDKs for interacting with Bitcoin, Stacks, and other blockchain technologies. This package provides utilities for wallet management, smart contract interactions, and blockchain operations.

## Features

- 🏦 **Wallet Management**: Interact with Bitcoin and Stacks wallets
- 🔄 **Blockchain Operations**: Perform transactions and queries
- 🤖 **DAO Tools**: Create and manage DAOs on Stacks
- 🔍 **BNS Operations**: Work with Bitcoin Name Service
- 📝 **Smart Contract Tools**: Deploy and interact with smart contracts

## Installation

```bash
npm install @aibtcdev/tools
# or
yarn add @aibtcdev/tools
```

## Quick Start

### Working with DAOs

```typescript
import { DaoSDK } from "@aibtcdev/tools";

// Initialize the DAO SDK
const daoSdk = new DaoSDK({
  network: "mainnet", // or 'testnet'
  stacksApi: "https://api.mainnet.hiro.so",
});

// Create and deploy a DAO
async function deployDao() {
  const deployedDao = await daoSdk.executor.deploy({
    name: "MyDAO",
    contractName: "my-dao-v1",
    extensions: [],
    includeDeployer: true,
    senderKey: "YOUR_PRIVATE_KEY",
    fee: 10000,
  });
}
```

### Wallet Operations

```typescript
import { getWalletStatus } from "@aibtcdev/tools";

// Check wallet status
const status = await getWalletStatus();
console.log("Wallet Status:", status);
```

### BNS Operations

```typescript
import { getAddressByBns } from "@aibtcdev/tools";

// Lookup BNS address
const address = await getAddressByBns("myname.btc");
console.log("Address:", address);
```

## Available Tools

### DAO SDK

The DAO SDK provides comprehensive tools for creating and managing DAOs on the Stacks blockchain. [View DAO SDK Documentation](./docs/dao-sdk.md)

Features:

- Contract Generation & Deployment
- Extension Management (Treasury, Bank, Payments)
- Smart Contract Interaction
- Multi-Network Support

### Wallet Tools

Tools for interacting with Bitcoin and Stacks wallets. [View Wallet Documentation](./docs/wallet-tools.md)

### BNS Tools

Utilities for working with the Bitcoin Name Service. [View BNS Documentation](./docs/bns-tools.md)

### SIP-009 Tools

Tools for working with NFTs on Stacks. [View SIP-009 Documentation](./docs/sip009-tools.md)

## Development

### Prerequisites

- Node.js >= 18
- Bun.js (recommended for development)

### Setup

1. Clone the repository
2. Install dependencies: `bun install`
3. Run tests: `bun test`

### Configuration

Create an `.env` file in your project root:

```env
NETWORK=testnet               # or mainnet
MNEMONIC=your-mnemonic-phrase # full wallet control
ACCOUNT_INDEX=0               # select account in wallet
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

- Discord: [Join our community](https://discord.gg/Z59Z3FNbEX)
- Twitter: [@aibtcdev](https://twitter.com/aibtcdev)
- Email: support@aibtc.dev

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
