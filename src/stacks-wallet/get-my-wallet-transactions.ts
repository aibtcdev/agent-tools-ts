// CONFIGURATION

import { Transaction } from "@stacks/stacks-blockchain-api-types";
import { CONFIG, getApiUrl, deriveChildAccount } from "../utilities";

// gets transaction data from the API
interface TransactionsResponse {
  results: Transaction[];
}

async function getWalletTransactions(network: string, address: string) {
  const apiUrl = getApiUrl(network);
  const response = await fetch(`${apiUrl}/extended/v2/addresses/${address}/transactions`);
  if (!response.ok) {
    throw new Error(`Failed to get transactions: ${response.statusText}`);
  }
  const data = await response.json() as TransactionsResponse;
  return data.results;
}

// MAIN SCRIPT (DO NOT EDIT)

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

  try {
    // Get wallet address
    const { address } = await deriveChildAccount(network, mnemonic, accountIndex);

    // Get transactions for the address
    const txResponse = await getWalletTransactions(network, address);
    console.log(JSON.stringify(txResponse, null, 2));
  } catch (error) {
    // report error
    console.error(`General/Unexpected Failure: ${error}`);
  }
}

main();