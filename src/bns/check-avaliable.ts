import { canRegisterName } from "@stacks/bns";
import { CONFIG, getNetwork } from "../utilities";

async function queryNameAvailability(name: string) {
  const networkObj = getNetwork(CONFIG.NETWORK);

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
