import { getNonce } from "@stacks/transactions";
import { deriveChildAccount } from "./utilities";

async function main() {
  // get account info from env
  const network = Bun.env.network;
  const mnemonic = Bun.env.mnemonic;
  const accountIndex = Bun.env.accountIndex;
  // check that values exist for each
  if (!network) {
    throw new Error("No network provided in environment variables");
  }
  if (!mnemonic) {
    throw new Error("No mnemonic provided in environment variables");
  }
  if (!accountIndex) {
    throw new Error("No account index provided in environment variables");
  }
  // get account address and private key
  const { address } = await deriveChildAccount(network, mnemonic, accountIndex);
  // get the current nonce for the account
  const nonce = await getNonce(address, network);
  // log the account info
  console.log(`Account address: ${address}`);
  console.log(`Nonce: ${nonce}`);
}

main();
