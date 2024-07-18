// CONFIGURATION

import { CONFIG, getAddressBalance } from "../utilities";

// MAIN SCRIPT (DO NOT EDIT)

async function main() {
  // expect txId as first argument
  const addr = process.argv[2];
  if (!addr) {
    console.error("No address provided, exiting...");
    return;
  }

  // get transaction info from API
  try {
    const balance = await getAddressBalance(CONFIG.NETWORK, addr);
    console.log(balance);
  } catch (error) {
    // report error
    console.error(`General/Unexpected Failure: ${error}`);
  }
}

main();
