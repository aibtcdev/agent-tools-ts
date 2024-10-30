import { CONFIG, deriveChildAccount } from "../utilities";

// get first 10 account addresses from wallet

// MAIN SCRIPT (DO NOT EDIT BELOW)

async function main() {
  // get account info from env
  const network = CONFIG.NETWORK;
  const mnemonic = CONFIG.MNEMONIC;
  const accountIndex = CONFIG.ACCOUNT_INDEX;

  // check that values exist for each
  if (!network) {
    throw new Error("No network provided in environment variables");
  }
  if (!mnemonic) {
    throw new Error("No mnemonic provided in environment variables");
  }

  // get account addresses
  const { address } = await deriveChildAccount(network, mnemonic, accountIndex);

  // log account addresses with their index
  console.log(`${accountIndex}: ${address}`);
}

main();
