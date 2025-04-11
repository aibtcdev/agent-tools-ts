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
  "Usage: bun run get-recent-payment.ts <paymentProcessorContract> <resourceIndex> <userIndex>";
const usageExample =
  "Example: bun run get-recent-payment.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-payment-processor-stx 1 1";

interface ExpectedArgs {
  paymentProcessorContract: string;
  resourceIndex: number;
  userIndex: number;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [paymentProcessorContract, resourceIndexStr, userIndexStr] =
    process.argv.slice(2);
  const resourceIndex = parseInt(resourceIndexStr);
  const userIndex = parseInt(userIndexStr);
  if (!paymentProcessorContract || !resourceIndex || !userIndex) {
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
    resourceIndex,
    userIndex,
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
  // get recent payment
  const result = await callReadOnlyFunction({
    contractAddress,
    contractName,
    functionName: "get-recent-payment",
    functionArgs: [Cl.uint(args.resourceIndex), Cl.uint(args.userIndex)],
    senderAddress: address,
    network: networkObj,
  });
  // extract and return recent payment
  if (result.type === ClarityType.OptionalSome) {
    const recentPayment = cvToValue(result.value);
    return {
      success: true,
      message: "Recent payment retrieved successfully",
      data: recentPayment,
    };
  } else {
    const errorMessage = `No recent payment found for resource ${args.resourceIndex} and user ${args.userIndex}`;
    throw new Error(errorMessage);
  }
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
