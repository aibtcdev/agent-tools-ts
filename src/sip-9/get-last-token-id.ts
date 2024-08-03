import { callReadOnlyFunction, cvToJSON } from "@stacks/transactions";
import { getNetwork, CONFIG, deriveChildAccount } from "../utilities";

async function getLastTokenId(contractAddress, contractName) {
  const network = getNetwork(CONFIG.NETWORK);
  const { address } = await deriveChildAccount(CONFIG.NETWORK, CONFIG.MNEMONIC, CONFIG.ACCOUNT_INDEX);

  try {
    console.log(`Fetching last token ID from contract ${contractName} at address ${contractAddress}...`);
    
    const result = await callReadOnlyFunction({
      contractAddress,
      contractName,
      functionName: "get-last-token-id",
      functionArgs: [],
      network,
      senderAddress: address,
    });

    const jsonResult = cvToJSON(result);
    console.log(`Last token ID: ${jsonResult.value}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error fetching last token ID: ${error.message}`);
    } else {
      console.error(`An unknown error occurred while fetching the last token ID`);
    }
  }
}

const [contractAddress, contractName] = process.argv.slice(2);

if (contractAddress && contractName) {
  getLastTokenId(contractAddress, contractName);
} else {
  console.error("Please provide a contract address and contract name as arguments.");
  console.error("Usage: <contractAddress> <contractName>");
}
