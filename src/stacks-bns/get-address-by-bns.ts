import { CONFIG, getApiUrl } from "../utilities";

type NamesDataResponse = {
  address: string;
  blockchain: string;
  expire_block?: number;
  grace_period?: number;
  last_txid?: string;
  resolver?: string;
  status?: string;
  zonefile?: string;
  zonefile_hash?: string;
};

// gets address by name from the hiro api
async function getAddressByName(network: string, name: string) {
  const apiUrl = getApiUrl(network);
  const response = await fetch(`${apiUrl}/v1/names/${name.toLowerCase()}`, {
    headers: {
      Accept: "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to get address by name: ${response.statusText}`);
  }
  const data = (await response.json()) as NamesDataResponse;
  return data.address;
}

async function queryAddressForName(name: string) {
  try {
    const address = await getAddressByName(CONFIG.NETWORK, name);
    console.log(address);
  } catch (error) {
    console.error(`Error querying address for name: ${error}`);
  }
}

const name = process.argv[2];
if (name) {
  queryAddressForName(name);
} else {
  console.error("Please provide a name as an argument.");
}
