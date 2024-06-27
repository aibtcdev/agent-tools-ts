import { CONFIG, getAddressByName } from "../utilities";

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
