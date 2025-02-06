import { callReadOnlyFunction } from "@stacks/transactions";
import {
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  getNetwork,
  sendToLLM,
} from "../../../../utilities";

const usage =
  "Usage: bun run get-voting-configuration.ts <daoActionProposalsExtensionContract>";
const usageExample =
  "Example: bun run get-voting-configuration.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.wed-action-proposals-v2";

interface ExpectedArgs {
  daoActionProposalsExtensionContract: string;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [daoActionProposalsExtensionContract] = process.argv.slice(2);
  if (!daoActionProposalsExtensionContract) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    sendToLLM({
      success: false,
      message: errorMessage,
    });
    process.exit(1);
  }
  // verify contract addresses extracted from arguments
  const [extensionAddress, extensionName] =
    daoActionProposalsExtensionContract.split(".");
  if (!extensionAddress || !extensionName) {
    const errorMessage = [
      `Invalid contract address: ${daoActionProposalsExtensionContract}`,
      usage,
      usageExample,
    ].join("\n");
    sendToLLM({
      success: false,
      message: errorMessage,
    });
    process.exit(1);
  }
  // return validated arguments
  return {
    daoActionProposalsExtensionContract,
  };
}

async function main() {
  // validate and store provided args
  const args = validateArgs();
  const [extensionAddress, extensionName] =
    args.daoActionProposalsExtensionContract.split(".");
  // setup network and wallet info
  const networkObj = getNetwork(CONFIG.NETWORK);
  const { address } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  // get voting configuration
  const result = await callReadOnlyFunction({
    contractAddress: extensionAddress,
    contractName: extensionName,
    functionName: "get-voting-configuration",
    functionArgs: [],
    senderAddress: address,
    network: networkObj,
  });
  // return voting configuration
  return {
    success: true,
    message: "Voting configuration retrieved successfully",
    data: result,
  };
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
