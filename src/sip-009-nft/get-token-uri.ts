import { callReadOnlyFunction, cvToJSON, uintCV } from "@stacks/transactions";
import { CONFIG, getNetwork, deriveChildAccount } from "../utilities";

async function getLastTokenId(
  contractAddress: string,
  contractName: string,
  senderAddress: string
) {
  const network = getNetwork(CONFIG.NETWORK);

  try {
    const result = await callReadOnlyFunction({
      contractAddress,
      contractName,
      functionName: "get-last-token-id",
      functionArgs: [],
      network,
      senderAddress,
    });

    const jsonResult = cvToJSON(result);
    return parseInt(jsonResult.value);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Error fetching last token ID: ${error.message}`);
    } else {
      console.error(`An unknown error occurred while fetching last token ID`);
    }
    return null;
  }
}

async function getTokenUri(
  contractAddress: string,
  contractName: string,
  tokenId: number | null
) {
  const network = getNetwork(CONFIG.NETWORK);
  const { address } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );

  if (tokenId === null) {
    tokenId = await getLastTokenId(contractAddress, contractName, address);
    if (tokenId === null) {
      console.error("Failed to get last token ID. Cannot proceed.");
      return;
    }
  }

  try {
    const result = await callReadOnlyFunction({
      contractAddress,
      contractName,
      functionName: "get-token-uri",
      functionArgs: [uintCV(tokenId)],
      network,
      senderAddress: address,
    });

    const jsonResult = cvToJSON(result);
    console.log(`Token URI for token ID ${tokenId}:`);
    console.log(jsonResult.value);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Error fetching token URI: ${error.message}`);
    } else {
      console.error(`An unknown error occurred while fetching token URI`);
    }
  }
}

const [contractAddress, contractName] = process.argv[2]?.split(".") || [];
const tokenId = process.argv[3] ? parseInt(process.argv[3]) : null;

if (contractAddress && contractName) {
  getTokenUri(contractAddress, contractName, tokenId);
} else {
  console.error(
    "Please provide a contract address.name and optionally a token ID"
  );
}
