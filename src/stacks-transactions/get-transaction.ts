// CONFIGURATION

import { Transaction } from "@stacks/stacks-blockchain-api-types";
import { CONFIG, getApiUrl } from "../utilities";

// gets transaction data from the API
async function getTransaction(network: string, txId: string) {
  const apiUrl = getApiUrl(network);
  const response = await fetch(`${apiUrl}/extended/v1/tx/${txId}`);
  if (!response.ok) {
    throw new Error(`Failed to get transaction: ${response.statusText}`);
  }
  const data = await response.json();
  return data as Transaction;
}

// MAIN SCRIPT (DO NOT EDIT)

async function main() {
  // expect txId as first argument
  const txId = process.argv[2];
  if (!txId) {
    console.error("No transaction ID provided, exiting...");
    return;
  }

  // get transaction info from API
  try {
    const txResponse = await getTransaction(CONFIG.NETWORK, txId);
    console.log(txResponse);
  } catch (error) {
    // report error
    console.error(`General/Unexpected Failure: ${error}`);
  }
}

main();
