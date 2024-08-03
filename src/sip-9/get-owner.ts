import { callReadOnlyFunction, cvToJSON, uintCV } from "@stacks/transactions";
import { getNetwork, CONFIG, deriveChildAccount } from "../utilities";

async function getOwner(contractAddress, contractName, tokenId) {
  const network = getNetwork(CONFIG.NETWORK);
  const { address } = await deriveChildAccount(CONFIG.NETWORK, CONFIG.MNEMONIC, CONFIG.ACCOUNT_INDEX);

  try {
    console.log(`Fetching owner of token ID ${tokenId} from contract ${contractName} at address ${contractAddress}...`);
    
    const result = await callReadOnlyFunction({
      contractAddress,
      contractName,
      functionName: "get-owner",
      functionArgs: [uintCV(tokenId)],
      network,
      senderAddress: address,
    });
    
    const jsonResult = cvToJSON(result);

    if (jsonResult.type === "(response (optional principal) UnknownType)" && jsonResult.success) {
      const ownerAddress = jsonResult.value.value.value;
      console.log(`Owner address: ${ownerAddress}`);
    } else {
      console.log("No owner found or unexpected result");
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error fetching owner: ${error.message}`);
    } else {
      console.error(`An unknown error occurred while fetching owner`);
    }
  }
}

const [contractAddress, name, tokenIdArg] = process.argv.slice(2);
const parsedTokenId = tokenIdArg ? parseInt(tokenIdArg) : null;

if (contractAddress && name && parsedTokenId !== null && !isNaN(parsedTokenId)) {
  getOwner(contractAddress, name, parsedTokenId);
} else {
  console.error("Please provide a valid contract address, name, token ID.");
  console.error("Usage: <contractAddress> <name> <tokenId>");
}
