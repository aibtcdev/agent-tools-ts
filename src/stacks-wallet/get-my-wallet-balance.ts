// CONFIGURATION

import { StackingClient } from "@stacks/stacking";
import {
  CONFIG,
  getNetwork,
  getNetworkByPrincipal,
  deriveChildAccount,
  microStxToStx,
  getTradableDetails,
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

async function logBalanceDetails(balance: any) {
  const tokenMetadata = await getTradableDetails();
  const stxTokenMetadata = tokenMetadata.find((t) => t.contract_id === "stx");

  // Calculate STX value
  const stxValueUsd =
    microStxToStx(balance.stx.balance) *
    (stxTokenMetadata?.metrics?.price_usd ?? 0);

  // Initialize total value with STX value
  let totalValueUsd = stxValueUsd;

  const balanceOutput = {
    total_value_usd: 0, // Placeholder, will be updated later
    stx: {
      price_usd: stxTokenMetadata?.metrics?.price_usd ?? 0,
      balance: microStxToStx(balance.stx.balance),
      value_usd: stxValueUsd,
      locked: microStxToStx(balance.stx.locked),
    },
    fungible_tokens: {} as Record<
      string,
      {
        balance: number;
        decimals?: number;
        price_usd: number;
        value_usd: number;
      }
    >,
    non_fungible_tokens: {} as Record<
      string,
      {
        count: number;
      }
    >,
  };

  // Process fungible tokens
  for (const [token, details] of Object.entries(balance.fungible_tokens) as [
    string,
    any
  ]) {
    const tokenName = token.split("::")[0];
    const tokenSpecific = tokenMetadata.find(
      (t) => t.contract_id === tokenName
    );

    const tokenPriceUsd = tokenSpecific?.metrics?.price_usd ?? 0;
    const tokenDecimals = tokenSpecific?.decimals ?? 0;
    const tokenBalance =
      parseFloat(details.balance) / Math.pow(10, tokenDecimals);
    const tokenValueUsd = tokenBalance * tokenPriceUsd;

    // Add token value to total
    totalValueUsd += tokenValueUsd;

    balanceOutput.fungible_tokens[tokenName] = {
      balance: tokenBalance,
      decimals: tokenDecimals,
      price_usd: tokenPriceUsd,
      value_usd: tokenValueUsd,
    };
  }

  // Process non-fungible tokens
  for (const [token, details] of Object.entries(
    balance.non_fungible_tokens
  ) as [string, any]) {
    balanceOutput.non_fungible_tokens[token] = {
      count: details.count,
    };
  }

  // Update total value in the output
  balanceOutput.total_value_usd = Number(totalValueUsd.toFixed(2));

  console.log(JSON.stringify(balanceOutput, null, 2));
  return balanceOutput;
}

// MAIN SCRIPT (DO NOT EDIT)

async function main() {
  // expect txId as first argument
  const network = CONFIG.NETWORK;
  const mnemonic = CONFIG.MNEMONIC;
  const accountIndex = CONFIG.ACCOUNT_INDEX | 0;

  // check that values exist for each
  if (!network) {
    throw new Error("No network provided in environment variables");
  }
  if (!mnemonic) {
    throw new Error("No mnemonic provided in environment variables");
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
