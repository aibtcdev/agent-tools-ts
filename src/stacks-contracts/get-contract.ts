import { CONFIG, getContractSource } from "../utilities";

// CONFIGURATION

const network = CONFIG.NETWORK;

const contractAddr = process.argv[2];

if (contractAddr) {
  if (contractAddr.includes(".")) {
    const [contractAddress, contractName] = contractAddr.split(".");

    try {
      const source = await getContractSource(
        network,
        contractAddress,
        contractName
      );
      console.log(source);
    } catch (error) {
      console.error(`Error fetching contract source: ${error.message}`);
    }
  } else {
    console.error("The contract address must be separated by a period.");
  }
} else {
  console.error("Please provide a contract address and name as arguments.");
}
