import { CONFIG, getContractSource } from "../utilities";

// CONFIGURATION

const network = CONFIG.NETWORK;

const contractAddr = process.argv[2];
const contractName = process.argv[3];

if (contractAddr && contractName) {
  const source = await getContractSource(network, contractAddr, contractName);
  console.log(source);
} else {
  console.error("Please provide a contract address and name as arguments.");
}
