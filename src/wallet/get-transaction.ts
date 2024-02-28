// CONFIGURATION

import { getTransaction } from "../utilities";

const NETWORK = Bun.env.network;

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

  // get transaction info from API
  try {
    const txResponse = await getTransaction(network, txId);
    console.log(txResponse);
  } catch (error) {
    // report error
    console.error(`General/Unexpected Failure: ${error}`);
  }
}

main();
