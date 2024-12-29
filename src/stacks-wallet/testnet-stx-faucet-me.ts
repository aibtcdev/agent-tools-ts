// CONFIGURATION

import { CONFIG, getApiUrl, deriveChildAccount } from "../utilities";

async function getFaucetDrop(
  network: string,
  address: string,
) {
  if (network !== "testnet") {
    throw new Error("Faucet drops are only available on the testnet.");
  }

  const apiUrl = getApiUrl(network);
  const response = await fetch(
    `${apiUrl}/extended/v1/faucets/stx?address=${address}`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get faucet drop: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

async function main() {
  // get account info from env
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

  // get account address
  const { address } = await deriveChildAccount(network, mnemonic, accountIndex);

  // get transaction info from API
  try {
    const balance = await getFaucetDrop(CONFIG.NETWORK, address);
    console.log(balance);
  } catch (error) {
    // report error
    console.error(`General/Unexpected Failure: ${error}`);
  }
}

main();
