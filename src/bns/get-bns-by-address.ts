import { CONFIG, getNamesOwnedByAddress } from "../utilities";

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
