<img src="https://aibtc.dev/logos/aibtcdev-primary-logo-black-wide-1000px.png" alt="AIBTC Working Group Logo" style="width: 100%; max-width: 1000px; display: block; margin: 1rem auto;" />

# AIBTC Agent Tools (TypeScript)

A collection of TypeScript tools for interacting with Bitcoin and Stacks.

This package provides utilities for wallet management, smart contract interactions, and blockchain operations.

## Development

### Installation

```
bun add @aibtc/agent-tools
```

_We recommend using [Bun](https://bun.sh/) as the preferred package manager for best performance and compatibility._

Alternatively, you can use npm or yarn:

```
npm install @aibtc/agent-tools
# or
yarn add @aibtc/agent-tools
```

### Configuration

Create an `.env` file in your project root with the following variables:

```env
# Network selection: 'testnet' or 'mainnet'
NETWORK=testnet

# Wallet seed phrase (keep this safe and never share it)
MNEMONIC=your twelve or twenty-four word seed phrase

# Account index to use (first account = 0)
ACCOUNT_INDEX=0

# Bitflow API configuration (get keys from Bitflow Discord)
BITFLOW_API_HOST=
BITFLOW_API_KEY=
BITFLOW_STACKS_API_HOST=https://api.hiro.so/
BITFLOW_READONLY_CALL_API_HOST=

# Jing API configuration
JING_API_URL=https://backend-neon-ecru.vercel.app/api
JING_API_KEY=dev-api-token

# Hiro API key
HIRO_API_KEY=your-api-key

# AIBTC configuration
AIBTC_DEFAULT_FEE=100000 # in uSTX (0.1 STX)
AIBTC_FAKTORY_API_KEY=your-api-key
AIBTC_CORE_API_KEY=your-api-key
```

## Command-Line Tools

This repository contains several command-line tools for interacting with Stacks contracts. These tools provide safe, post-condition-protected methods for trading on Faktory DEXs.

### Trading via an Agent Account

These scripts execute trades through a deployed agent account smart contract. They are ideal for managing assets held within a specialized contract.

**Sell an Asset:**

Sell a specific amount of a fungible token for the DEX's payment asset (e.g., STX or sBTC).

```sh
bun run src/aibtc-cohort-0/agent-account/public/faktory-sell-asset.ts <agentContract> <dexContract> <assetContract> <amountToSell> [slippage]
```
-   **`<agentContract>`**: Your agent account contract (e.g., `ST1...agent-v1`).
-   **`<dexContract>`**: The Faktory DEX contract (e.g., `ST2...aibtc-dex`).
-   **`<assetContract>`**: The token you are selling (e.g., `ST2...aibtc-token`).
-   **`<amountToSell>`**: The number of tokens you want to sell.
-   **`[slippage]`**: Optional. Slippage tolerance in percent (e.g., `1` for 1%). Defaults to 1%.

**Buy an Asset:**

Spend a specific amount of the DEX's payment asset (e.g., STX or sBTC) to buy a fungible token.

```sh
bun run src/aibtc-cohort-0/agent-account/public/faktory-buy-asset.ts <agentContract> <dexContract> <assetContract> <amountToSpend> [slippage]
```
-   **`<amountToSpend>`**: The amount of STX or sBTC you want to spend.
-   Other arguments are the same as selling.

### Direct Wallet-to-DEX Trading

These scripts execute trades directly from your wallet configured in the `.env` file.

**Sell a Token (Directly):**
```sh
bun run src/stacks-faktory/exec-sell.ts <tokenAmount> <dexContract> [slippage]
```

**Buy a Token (Directly):**
```sh
# For BTC-denominated pools
bun run src/stacks-faktory/exec-buy.ts <btcAmount> <dexContract> [slippage]
```

## Usage Example

Here's a basic example of how to import and use the package in your project:

```ts
import { createWallet } from '@aibtc/agent-tools';

const wallet = createWallet(process.env.MNEMONIC!, Number(process.env.ACCOUNT_INDEX || 0));
console.log('Wallet address:', wallet.address);
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Community

- Discord: [Join our community](https://discord.gg/Z59Z3FNbEX)
- Twitter: [@aibtcdev](https://twitter.com/aibtcdev)
- Docs: [AIBTC docs](https://docs.aibtc.dev/)

## Docker

You can build and run this project using Docker with Bun for a consistent and fast development or production environment.

### Build the Docker image

```sh
docker build --pull -t aibtc-agent-tools .
```

### Run Bun command-line tools in the Docker container

You can run any Bun-based CLI tool or script from this project inside the container. For example, to run a script called `my-tool.ts`:

```sh
docker run --rm -it aibtc-agent-tools src/my-tool.ts
```

- Replace `src/my-tool.ts` with the path to the tool or script you want to run.
- You can pass additional arguments after the script name as needed, e.g.:
  ```sh
  docker run --rm -it aibtc-agent-tools src/my-tool.ts --help
  ```
- The container does not expose any ports by default, as this project is not a server.

### Customizing
- Edit the `Dockerfile` and `.dockerignore` as needed for your deployment or development needs.
- Make sure to set up your `.env` file for environment variables (see Configuration section above).
