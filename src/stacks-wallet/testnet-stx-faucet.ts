// CONFIGURATION

import { CONFIG, getApiUrl } from "../utilities";

async function getFaucetDrop(
  network: string,
  address: string,
  unanchored: boolean = true
) {
  if (network !== "testnet") {
    throw new Error("Faucet drops are only available on the testnet.");
  }

  const apiUrl = getApiUrl(network);
  const response = await fetch(
    `${apiUrl}/extended/v1/faucets/stx?address=${address}&unanchored=${unanchored}`,
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
  // expect txId as first argument
  const addr = process.argv[2];
  if (!addr) {
    console.error("No address provided, exiting...");
    return;
  }

  // get transaction info from API
  try {
    const balance = await getFaucetDrop(CONFIG.NETWORK, addr);
    console.log(balance);
  } catch (error) {
    // report error
    console.error(`General/Unexpected Failure: ${error}`);
  }
}

main();
