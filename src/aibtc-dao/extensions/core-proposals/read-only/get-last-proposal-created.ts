import { fetchCallReadOnlyFunction, cvToValue } from "@stacks/transactions";
import {
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  getNetwork,
  sendToLLM,
  ToolResponse,
} from "../../../../utilities";

const usage =
  "Usage: bun run get-last-proposal-created.ts <daoCoreProposalsExtensionContract>";
const usageExample =
  "Example: bun run get-last-proposal-created.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-core-proposals-v2";

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
  const [extensionAddress, extensionName] =
    daoCoreProposalsExtensionContract.split(".");
  if (!extensionAddress || !extensionName) {
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

async function main(): Promise<ToolResponse<number>> {
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
  // call read-only function
  const result = await fetchCallReadOnlyFunction({
    contractAddress: extensionAddress,
    contractName: extensionName,
    functionName: "get-last-proposal-created",
    functionArgs: [],
    senderAddress: address,
    network: networkObj,
  });
  // extract and return result
  const lastProposalCreated = parseInt(cvToValue(result, true));
  if (isNaN(lastProposalCreated)) {
    throw new Error(`Failed to parse last proposal created: ${result}`);
  }
  return {
    success: true,
    message: "Last proposal created successfully retrieved",
    data: lastProposalCreated,
  };
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
