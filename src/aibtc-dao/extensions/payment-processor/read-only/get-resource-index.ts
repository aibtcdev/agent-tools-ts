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
  isValidContractPrincipal,
  sendToLLM,
  ToolResponse,
} from "../../../../utilities";

const usage =
  "Usage: bun run get-resource-index.ts <paymentProcessorContract> <resourceName>";
const usageExample =
  "Example: bun run get-resource-index.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-payment-processor-stx resource-name";

interface ExpectedArgs {
  paymentProcessorContract: string;
  resourceName: string;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [paymentProcessorContract, resourceName] = process.argv.slice(2);
  if (!paymentProcessorContract || !resourceName) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // verify contract addresses extracted from arguments
  if (!isValidContractPrincipal(paymentProcessorContract)) {
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
    resourceName,
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
  // get resource index
  const result = await callReadOnlyFunction({
    contractAddress,
    contractName,
    functionName: "get-resource-index",
    functionArgs: [Cl.stringUtf8(args.resourceName)],
    senderAddress: address,
    network: networkObj,
  });
  // extract and return resource index
  if (result.type === ClarityType.OptionalSome) {
    const resourceIndex = cvToValue(result.value);
    return {
      success: true,
      message: "Resource index retrieved successfully",
      data: resourceIndex,
    };
  } else {
    const errorMessage = `Resource not found: ${args.resourceName}`;
    throw new Error(errorMessage);
  }
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
