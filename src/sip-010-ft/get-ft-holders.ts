// CONFIGURATION

import { CONFIG, getApiUrl } from "../utilities";

type FungibleTokenHoldersResponse = {
  limit: number;
  offset: number;
  total: number;
  total_supply: string;
  results: {
    address: string;
    balance: string;
  }[];
};

// gets fungible token holders from the API
async function getFungibleTokenHolders(
  network: string,
  token: string,
  limit: number = 200,
  offset: number = 0
) {
  const apiUrl = getApiUrl(network);
  const response = await fetch(
    `${apiUrl}/extended/v1/tokens/ft/${token}/holders?limit=${limit}&offset=${offset}`
  );
  if (!response.ok) {
    throw new Error(
      `Failed to get fungible token holders: ${response.statusText}`
    );
  }
  const data = await response.json();
  return data as FungibleTokenHoldersResponse;
}

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
