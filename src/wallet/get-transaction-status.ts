// CONFIGURATION

import type { Transaction } from "@stacks/stacks-blockchain-api-types";
import { deriveChildAccount, getTransaction } from "../utilities";

const NETWORK = Bun.env.network;
const MNEMONIC = Bun.env.mnemonic;
const ACCOUNT_INDEX = Bun.env.accountIndex;

// MAIN SCRIPT (DO NOT EDIT)

async function main() {
  // expect txId as first argument
  const txId = process.argv[2];
  if (!txId) {
    console.error("No transaction ID provided, exiting...");
    return;
  }

  // get account info
  const network = NETWORK;
  const mnemonic = MNEMONIC;
  const accountIndex = ACCOUNT_INDEX;

  // get address from mnemonic
  const { address } = await deriveChildAccount(network, mnemonic, accountIndex);

  // get transaction info from API
  try {
    const txResponse: Transaction = await getTransaction(network, txId);
    // get transaction status from object
    const txStatus = txResponse.tx_status;
    console.log(txStatus);
  } catch (error) {
    // report error
    console.error(`General/Unexpected Failure: ${error}`);
  }
}

main();
