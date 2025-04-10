import {
  callReadOnlyFunction,
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
  "Usage: bun run get-resource.ts <paymentProcessorContract> <resourceIndex>";
const usageExample =
  "Example: bun run get-resource.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-payment-processor-stx 1";

interface ExpectedArgs {
  paymentProcessorContract: string;
  resourceIndex: number;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [paymentProcessorContract, resourceIndexStr] = process.argv.slice(2);
  const resourceIndex = parseInt(resourceIndexStr);
  if (!paymentProcessorContract || !resourceIndex) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // verify contract addresses extracted from arguments
  const [contractAddress, contractName] = paymentProcessorContract.split(".");
  if (!contractAddress || !contractName) {
    const errorMessage = [
      `Invalid contract address: ${paymentProcessorContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // return validated arguments
  return {
    paymentProcessorContract,
    resourceIndex,
  };
}

async function main(): Promise<ToolResponse<any>> {
  // validate and store provided args
  const args = validateArgs();
  const [contractAddress, contractName] =
    args.paymentProcessorContract.split(".");
  // setup network and wallet info
  const networkObj = getNetwork(CONFIG.NETWORK);
  const { address } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  // get resource data
  const result = await callReadOnlyFunction({
    contractAddress,
    contractName,
    functionName: "get-resource",
    functionArgs: [Cl.uint(args.resourceIndex)],
    senderAddress: address,
    network: networkObj,
  });
  // extract and return resource data
  if (result.type === ClarityType.OptionalSome) {
    const resourceData = cvToValue(result.value, true);
    return {
      success: true,
      message: "Resource data retrieved successfully",
      data: resourceData,
    };
  } else {
    const errorMessage = `Resource not found: ${args.resourceIndex}`;
    throw new Error(errorMessage);
  }
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
