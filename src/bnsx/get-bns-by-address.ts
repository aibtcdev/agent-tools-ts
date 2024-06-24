import { getNamesOwnedByAddress } from "../utilities";

const NETWORK = Bun.env.network;

async function queryNameForAddress(address: string) {
  const network = NETWORK;

  try {
    const names = await getNamesOwnedByAddress(network, address);
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
