import { canRegisterName } from "@stacks/bns";
import { getNetwork } from "../utilities";

const NETWORK = Bun.env.network;

async function queryNameAvailability(name: string) {
  const network = NETWORK;
  const networkObj = getNetwork(network);

  try {
    const isAvailable = await canRegisterName({
      fullyQualifiedName: name,
      network: networkObj,
    });
    console.log(isAvailable);
  } catch (error) {
    console.error(`Error querying name availability: ${error}`);
  }
}

const name = process.argv[2];
if (name) {
  queryNameAvailability(name);
} else {
  console.error("Please provide a name as an argument.");
}
