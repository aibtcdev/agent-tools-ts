<img src="https://aibtc.dev/logos/aibtcdev-primary-logo-black-wide-1000px.png" alt="AIBTC Working Group Logo" style="width: 100%; max-width: 1000px; display: block; margin: 1rem auto;" />

# AIBTC Agent Tools (TypeScript)

## Description

This repository contains a collection of TypeScript scripts that interact with a Bitcoin/Stacks wallet and the Stacks blockchain. These tools are designed to facilitate various operations such as fetching contract sources, retrieving wallet statuses, and performing blockchain transactions.

This project is intended to be used as a submodule within the [ai-agent-crew](https://github.com/aibtcdev/ai-agent-crew) project, providing low-level blockchain interactions for AI agents.

### Tech Stack

- [Bun.js](https://bun.sh) - JavaScript runtime and toolkit
- [Stacks.js](https://github.com/hirosystems/stacks.js) - JavaScript library for interacting with the Stacks blockchain

### Prerequisites

- Node.js (for Bun.js)
- Git

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/aibtcdev/agent-tools-ts.git
   cd agent-tools-ts
   ```

2. **Install Bun globally:**

   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

   > [!NOTE] Instructions above are for Linux, see the [Bun Website](https://bun.sh) for installing with other operating systems

3. **Install dependencies:**

   ```bash
   bun install
   ```

### Configuration

Create an `.env` file in the root directory and add the following variables:

```env
NETWORK=testnet               # or mainnet
MNEMONIC=your-mnemonic-phrase # full wallet control
ACCOUNT_INDEX=0               # select account in wallet
```

Replace `your-mnemonic-phrase` with your actual mnemonic phrase.

> [!CAUTION] The scripts will have full access to any accounts related to the actual mnemonic phrase. Be sure to use a separate wallet from any other activities and only fund it with what you're willing to lose.

### Running Scripts

To run a script, use the following command:

```bash
bun run src/<script-group>/<script-name>.ts [arguments]
```

For example:

```bash
bun run src/stacks-wallet/get-wallet-status.ts
bun run src/stacks-bns/get-address-by-bns.ts probablyhuman.btc
bun run src/sip-009/get-owner.ts contractAddress contractName tokenId
```

### Using as a Submodule

When used as a submodule in the ai-agent-crew project, these scripts are typically invoked through the `BunScriptRunner` class in Python. Refer to the [ai-agent-crew documentation](https://github.com/aibtcdev/ai-agent-crew) for more details on this integration.

### Contact

If you have any questions about contributing, please open an issue, ask in the [AIBTC Discord](https://discord.gg/Z59Z3FNbEX) or reach out to us on X [@aibtcdev](https://x.com/aibtcdev).
