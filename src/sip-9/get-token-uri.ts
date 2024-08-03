import { callReadOnlyFunction, cvToJSON, uintCV } from "@stacks/transactions";
import { getNetwork, CONFIG, deriveChildAccount } from "../utilities";

async function getLastTokenId(contractAddress, contractName, senderAddress) {
  const network = getNetwork(CONFIG.NETWORK);

  try {
    console.log(`Fetching last token ID from contract ${contractName} at address ${contractAddress}...`);
    
    const result = await callReadOnlyFunction({
      contractAddress,
      contractName,
      functionName: "get-last-token-id",
      functionArgs: [],
      network,
      senderAddress,
    });
    
    const jsonResult = cvToJSON(result);
    const lastTokenId = parseInt(jsonResult.value);
    console.log(`Last token ID: ${lastTokenId}`);
    return lastTokenId;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error fetching last token ID: ${error.message}`);
    } else {
      console.error(`An unknown error occurred while fetching last token ID`);
    }
    return null;
  }
}

async function getTokenUri(contractAddress, contractName, tokenId) {
  const network = getNetwork(CONFIG.NETWORK);
  const { address } = await deriveChildAccount(CONFIG.NETWORK, CONFIG.MNEMONIC, CONFIG.ACCOUNT_INDEX);

  if (tokenId === null) {
    tokenId = await getLastTokenId(contractAddress, contractName, address);
    if (tokenId === null) {
      console.error("Failed to get last token ID. Cannot proceed.");
      return;
    }
  }

  try {
    console.log(`Fetching token URI for token ID ${tokenId} from contract ${contractName} at address ${contractAddress}...`);
    
    const result = await callReadOnlyFunction({
      contractAddress,
      contractName,
      functionName: "get-token-uri",
      functionArgs: [uintCV(tokenId)],
      network,
      senderAddress: address,
    });
    
    const jsonResult = cvToJSON(result);
    console.log(`Token URI for token ID ${tokenId}: ${jsonResult.value}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error fetching token URI: ${error.message}`);
    } else {
      console.error(`An unknown error occurred while fetching token URI`);
    }
  }
}

const [contractAddress, contractName, tokenIdArg] = process.argv.slice(2);
const tokenId = tokenIdArg ? parseInt(tokenIdArg) : null;

if (contractAddress && contractName) {
  getTokenUri(contractAddress, contractName, tokenId);
} else {
  console.error("Please provide a valid contract address, name, optionally a token ID.");
  console.error("Usage: <contractAddress> <name> [tokenId]");
}
