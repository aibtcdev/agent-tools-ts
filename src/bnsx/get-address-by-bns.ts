import { getAddressByName } from "../utilities";

const NETWORK = Bun.env.network;

async function queryAddressForName(name: string) {
  const network = NETWORK;

  try {
    const address = await getAddressByName(network, name);
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
