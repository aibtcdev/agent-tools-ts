<img src="https://aibtc.dev/logos/aibtcdev-primary-logo-black-wide-1000px.png" alt="AIBTC Working Group Logo" style="width: 100%; max-width: 1000px; display: block; margin: 1rem auto;" />

# AIBTC Agent Tools (TypeScript)

## Description

This is a collection of TypeScript scripts that interact with a Bitcoin/Stacks wallet and the Stacks blockchain. These tools are designed to facilitate various operations such as fetching contract sources and retrieving wallet statuses.

## Development

### Tech Stack

- Bun.js
- Stacks.js

### Prerequisites

- Node.js (for Bun.js)
- Git

### Installation

To run this project locally, follow these steps:

1. **Clone the repository:**

   ```bash
   git clone https://github.com/aibtcdev/agent-tools-ts.git
   cd agent-tools-ts
   ```

2. **Install Bun globally:**

   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

3. **Install dependencies:**

   ```bash
   bun install
   ```

### Running Scripts

To run the scripts, use the following command:

```bash
bun run <script-name>
```

Replace <script-name> with the name of the script you want to execute. For example:

```bash
bun run src/stacks-wallet/get-wallet-status.ts
```

### Configuration

The project uses environment variables for configuration. Create a `.env` file in the root directory and add the following variables:

```env
NETWORK=testnet
MNEMONIC=your-mnemonic-phrase
ACCOUNT_INDEX=0
```

### Contact

For any questions or feedback, please open an issue or contact us at [@aibtcdev](https://x.com/aibtcdev).
