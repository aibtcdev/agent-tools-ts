import { CONFIG, deriveChildAccount, getNextNonce } from "../utilities";

// get currently selected wallet info from env file

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
  if (!accountIndex) {
    throw new Error("No account index provided in environment variables");
  }
  // get account address
  const { address } = await deriveChildAccount(network, mnemonic, accountIndex);
  // get the current nonce for the account
  const nonce = await getNextNonce(network, address);
  // log the account info
  console.log(`Account index: ${accountIndex}`);
  console.log(`Account address: ${address}`);
  console.log(`Nonce: ${nonce}`);
}

main();
