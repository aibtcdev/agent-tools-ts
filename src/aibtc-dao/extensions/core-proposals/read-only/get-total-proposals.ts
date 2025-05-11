import {
  fetchCallReadOnlyFunction,
  cvToValue,
  principalCV,
} from "@stacks/transactions";
import {
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  getNetwork,
  sendToLLM,
  ToolResponse,
} from "../../../../utilities";

const usage =
  "Usage: bun run get-total-proposals.ts <daoCoreProposalsExtensionContract>";
const usageExample =
  "Example: bun run get-total-proposals.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-core-proposals-v2";

interface ExpectedArgs {
  daoCoreProposalsExtensionContract: string;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [daoCoreProposalsExtensionContract] = process.argv.slice(2);
  if (!daoCoreProposalsExtensionContract) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // verify contract addresses extracted from arguments
  const [coreExtensionAddress, coreExtensionName] =
    daoCoreProposalsExtensionContract.split(".");
  if (!coreExtensionAddress || !coreExtensionName) {
    const errorMessage = [
      `Invalid contract address: ${daoCoreProposalsExtensionContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // return validated arguments
  return {
    daoCoreProposalsExtensionContract,
  };
}

// gets total proposals information from core proposal contract
async function main(): Promise<ToolResponse<object>> {
  // validate and store provided args
  const args = validateArgs();
  const [extensionAddress, extensionName] =
    args.daoCoreProposalsExtensionContract.split(".");
  // setup network and wallet info
  const networkObj = getNetwork(CONFIG.NETWORK);
  const { address } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  // get total proposals
  const result = await fetchCallReadOnlyFunction({
    contractAddress: extensionAddress,
    contractName: extensionName,
    functionName: "get-total-proposals",
    functionArgs: [],
    senderAddress: address,
    network: networkObj,
  });
  // return total proposals
  const totalProposals = JSON.parse(cvToValue(result));
  const response: ToolResponse<object> = {
    success: true,
    message: "Retrieved total proposals successfully",
    data: totalProposals,
  };
  return response;
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
