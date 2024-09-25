import { CONFIG, getApiUrl } from "../utilities";

type NamesResponse = {
  names: string[];
};

// gets names owned by address from the hiro API
async function getNamesOwnedByAddress(network: string, address: string) {
  const apiUrl = getApiUrl(network);
  const response = await fetch(`${apiUrl}/v1/addresses/stacks/${address}`, {
    headers: {
      Accept: "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(
      `Failed to get names owned by address: ${response.statusText}`
    );
  }
  const data = (await response.json()) as NamesResponse;
  return data.names;
}

async function queryNameForAddress(address: string) {
  try {
    const names = await getNamesOwnedByAddress(CONFIG.NETWORK, address);
    console.log(names);
  } catch (error) {
    console.error(`Error querying names for address: ${error}`);
  }
}

const address = process.argv[2];
if (address) {
  queryNameForAddress(address);
} else {
  console.error("Please provide an address as an argument.");
}
