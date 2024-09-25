import { callReadOnlyFunction, cvToJSON, uintCV } from "@stacks/transactions";
import { CONFIG, getNetwork, deriveChildAccount } from "../utilities";

async function getOwner(
  contractAddress: string,
  contractName: string,
  tokenId: number
) {
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
      functionName: "get-owner",
      functionArgs: [uintCV(tokenId)],
      network,
      senderAddress: address,
    });

    const jsonResult = cvToJSON(result);

    if (
      jsonResult.type === "(response (optional principal) UnknownType)" &&
      jsonResult.success
    ) {
      const ownerAddress = jsonResult.value.value.value;
      console.log(ownerAddress);
    } else {
      console.log("No owner found or unexpected result");
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Error fetching owner: ${error.message}`);
    } else {
      console.error(`An unknown error occurred while fetching owner`);
    }
  }
}

const [contractAddress, contractName] = process.argv[2]?.split(".") || [];
const tokenId = process.argv[3] ? parseInt(process.argv[3]) : null;

if (contractAddress && contractName && tokenId !== null) {
  getOwner(contractAddress, contractName, tokenId);
} else {
  console.error("Please provide a contract address.name and a token ID");
}
