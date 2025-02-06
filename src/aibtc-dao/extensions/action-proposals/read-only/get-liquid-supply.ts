import { callReadOnlyFunction, Cl } from "@stacks/transactions";
import {
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  getNetwork,
  sendToLLM,
} from "../../../../utilities";

const usage =
  "Usage: bun run get-liquid-supply.ts <daoActionProposalsExtensionContract> <stacksBlockHeight>";
const usageExample =
  "Example: bun run get-liquid-supply.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.wed-action-proposals-v2 562120";

interface ExpectedArgs {
  daoActionProposalsExtensionContract: string;
  stacksBlockHeight: number;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [daoActionProposalsExtensionContract, stacksBlockHeightStr] =
    process.argv.slice(2);
  const stacksBlockHeight = parseInt(stacksBlockHeightStr);
  if (!daoActionProposalsExtensionContract || !stacksBlockHeight) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
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
    throw new Error(errorMessage);
  }
  // return validated arguments
  return {
    daoActionProposalsExtensionContract,
    stacksBlockHeight,
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
  // get the liquid supply
  const result = await callReadOnlyFunction({
    contractAddress: extensionAddress,
    contractName: extensionName,
    functionName: "get-liquid-supply",
    functionArgs: [Cl.uint(args.stacksBlockHeight)],
    senderAddress: address,
    network: networkObj,
  });
  // return liquid supply
  return {
    success: true,
    message: "Liquid supply retrieved successfully",
    data: result,
  };
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
