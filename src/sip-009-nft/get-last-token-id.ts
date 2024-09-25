import { callReadOnlyFunction, cvToJSON } from "@stacks/transactions";
import { CONFIG, getNetwork, deriveChildAccount } from "../utilities";

async function getLastTokenId(contractAddress: string, contractName: string) {
  const network = getNetwork(CONFIG.NETWORK);
  const { address } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );

  try {
    const result = await callReadOnlyFunction({
      contractAddress,
      contractName,
      functionName: "get-last-token-id",
      functionArgs: [],
      network,
      senderAddress: address,
    });

    const jsonResult = cvToJSON(result);
    console.log(jsonResult.value);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Error fetching last token ID: ${error.message}`);
    } else {
      console.error(`An unknown error occurred while fetching last token ID`);
    }
  }
}

const [contractAddress, contractName] = process.argv[2]?.split(".") || [];

if (contractAddress && contractName) {
  getLastTokenId(contractAddress, contractName);
} else {
  console.error("Please provide a contract address and name as 'address.name'");
}
