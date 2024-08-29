// CONFIGURATION

import { CONFIG, getTransactionsByAddress } from "../utilities";

// MAIN SCRIPT (DO NOT EDIT)

async function main() {
  // expect txId as first argument
  const address = process.argv[2];
  const limit = Number(process.argv[3]) || 20;
  const offset = Number(process.argv[4]) || 0;

  if (!address) {
    console.error("No address provided, exiting...");
    return;
  }

  // get transaction info from API
  try {
    const response = await getTransactionsByAddress(
      CONFIG.NETWORK,
      address,
      limit,
      offset
    );
    console.log(JSON.stringify(response, null, 2));
  } catch (error) {
    // report error
    console.error(`General/Unexpected Failure: ${error}`);
  }
}

main();
