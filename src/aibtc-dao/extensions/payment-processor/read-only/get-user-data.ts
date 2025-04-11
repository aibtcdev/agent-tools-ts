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
  "Usage: bun run get-user-data.ts <paymentProcessorContract> <userIndex>";
const usageExample =
  "Example: bun run get-user-data.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-payment-processor-stx 1";

interface ExpectedArgs {
  paymentProcessorContract: string;
  userIndex: number;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [paymentProcessorContract, userIndexStr] = process.argv.slice(2);
  const userIndex = parseInt(userIndexStr);
  if (!paymentProcessorContract || !userIndex) {
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
  // get user data
  const result = await callReadOnlyFunction({
    contractAddress,
    contractName,
    functionName: "get-user-data",
    functionArgs: [Cl.uint(args.userIndex)],
    senderAddress: address,
    network: networkObj,
  });
  // extract and return user data
  if (result.type === ClarityType.OptionalSome) {
    const userData = cvToValue(result.value, true);
    return {
      success: true,
      message: "User data retrieved successfully",
      data: userData,
    };
  } else {
    const errorMessage = `User not found for index: ${args.userIndex}`;
    throw new Error(errorMessage);
  }
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
