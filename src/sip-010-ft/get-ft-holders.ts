// CONFIGURATION

import { CONFIG, getFungibleTokenHolders } from "../utilities";

// MAIN SCRIPT (DO NOT EDIT)

async function main() {
  // expect txId as first argument
  const address = process.argv[2];
  const limit = Number(process.argv[3]) || 200;
  const offset = Number(process.argv[4]) || 0;

  if (!address) {
    console.error("No address provided, exiting...");
    return;
  }

  // get transaction info from API
  try {
    const response = await getFungibleTokenHolders(
      CONFIG.NETWORK,
      address,
      limit,
      offset
    );
    console.log(response);
  } catch (error) {
    // report error
    console.error(`General/Unexpected Failure: ${error}`);
  }
}

main();
