// CONFIGURATION

import { StackingClient } from "@stacks/stacking";
import {
  CONFIG,
  getNetwork,
  getNetworkByPrincipal,
  deriveChildAccount,
  microStxToStx,
} from "../utilities";

async function getAddressBalanceDetailed(address: string) {
  const networkFromAddress = getNetworkByPrincipal(address);
  const stacksNetwork = getNetwork(networkFromAddress);
  const client = new StackingClient(address, stacksNetwork);

  try {
    const detailedBalance = await client.getAccountExtendedBalances();
    return detailedBalance;
  } catch (error: any) {
    throw new Error(`Failed to get address balance: ${error.message}`);
  }
}

// Function to format and log balance details
function logBalanceDetails(balance: any) {
  console.log("STX Balance:");
  console.log(`  Balance: ${microStxToStx(balance.stx.balance)}`);
  console.log(`  Total Sent: ${microStxToStx(balance.stx.total_sent)}`);
  console.log(`  Total Received: ${microStxToStx(balance.stx.total_received)}`);
  console.log(
    `  Total Fees Sent: ${microStxToStx(balance.stx.total_fees_sent)}`
  );
  console.log(
    `  Total Miner Rewards Received: ${balance.stx.total_miner_rewards_received}`
  );
  console.log(`  Lock TX ID: ${balance.stx.lock_tx_id}`);
  console.log(`  Locked: ${microStxToStx(balance.stx.locked)}`);
  console.log(`  Lock Height: ${balance.stx.lock_height}`);
  console.log(`  Burnchain Lock Height: ${balance.stx.burnchain_lock_height}`);
  console.log(
    `  Burnchain Unlock Height: ${balance.stx.burnchain_unlock_height}`
  );

  console.log("\nFungible Tokens:");
  for (const [token, details] of Object.entries(balance.fungible_tokens) as [
    string,
    any
  ]) {
    console.log(`  Token: ${token} Balance: ${details.balance}`);
  }

  console.log("\nNon-Fungible Tokens:");
  for (const [token, details] of Object.entries(
    balance.non_fungible_tokens
  ) as [string, any]) {
    console.log(`  Token: ${token}`);
    console.log(`    Count: ${details.count}`);
    console.log(`    Total Sent: ${details.total_sent}`);
    console.log(`    Total Received: ${details.total_received}`);
  }
}

// MAIN SCRIPT (DO NOT EDIT)

async function main() {
  // expect txId as first argument
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

  const { address } = await deriveChildAccount(network, mnemonic, accountIndex);

  // get transaction info from API
  try {
    const balance = await getAddressBalanceDetailed(address);
    logBalanceDetails(balance);
  } catch (error) {
    // report error
    console.error(`General/Unexpected Failure: ${error}`);
  }
}

main();
