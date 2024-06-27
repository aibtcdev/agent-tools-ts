// CONFIGURATION

import { CONFIG, getTransaction } from "../utilities";

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
