import {
  fetchCallReadOnlyFunction,
  Cl,
  ClarityType,
  cvToValue,
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
  "Usage: bun run get-liquid-supply.ts <daoCoreProposalsExtensionContract> <stacksBlockHeight>";
const usageExample =
  "Example: bun run get-liquid-supply.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-core-proposals-v2 562120";

interface ExpectedArgs {
  daoCoreProposalsExtensionContract: string;
  stacksBlockHeight: number;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [daoCoreProposalsExtensionContract, stacksBlockHeightStr] =
    process.argv.slice(2);
  const stacksBlockHeight = parseInt(stacksBlockHeightStr);
  if (!daoCoreProposalsExtensionContract || !stacksBlockHeight) {
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
    stacksBlockHeight,
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
  // get the liquid supply
  const result = await fetchCallReadOnlyFunction({
    contractAddress: extensionAddress,
    contractName: extensionName,
    functionName: "get-liquid-supply",
    functionArgs: [Cl.uint(args.stacksBlockHeight)],
    senderAddress: address,
    network: networkObj,
  });
  // extract and return liquid supply
  if (result.type === ClarityType.ResponseOk) {
    const liquidSupply = parseInt(cvToValue(result.value, true));
    if (isNaN(liquidSupply)) {
      throw new Error(`Error parsing liquid supply: ${result}`);
    }
    return {
      success: true,
      message: "Liquid supply retrieved successfully",
      data: liquidSupply,
    };
  } else {
    const errorMessage = `Error retrieving liquid supply: ${JSON.stringify(
      result
    )}`;
    throw new Error(errorMessage);
  }
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
