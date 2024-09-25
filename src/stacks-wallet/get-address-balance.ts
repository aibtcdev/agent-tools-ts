// CONFIGURATION

import { StackingClient } from "@stacks/stacking";
import { CONFIG, getNetwork } from "../utilities";

// Function to get the balance of an address
async function getAddressBalance(network: string, address: string) {
  const stacksNetwork = getNetwork(network);
  const client = new StackingClient(address, stacksNetwork);

  try {
    const balance = await client.getAccountBalance();
    const lockedBalance = await client.getAccountBalanceLocked();
    const unlocked = balance - lockedBalance;
    return {
      total: balance.toString(),
      locked: lockedBalance.toString(),
      unlocked: unlocked.toString(),
    };
  } catch (error) {
    throw new Error(`Failed to get address balance: ${error}`);
  }
}

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
