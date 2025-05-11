import {
  fetchCallReadOnlyFunction,
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

const usage = "Usage: bun run get-contract-data.ts <paymentProcessorContract>";
const usageExample =
  "Example: bun run get-contract-data.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-payment-processor-stx";

interface ExpectedArgs {
  paymentProcessorContract: string;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [paymentProcessorContract] = process.argv.slice(2);
  if (!paymentProcessorContract) {
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
  // get contract data
  const result = await fetchCallReadOnlyFunction({
    contractAddress,
    contractName,
    functionName: "get-contract-data",
    functionArgs: [],
    senderAddress: address,
    network: networkObj,
  });
  // extract and return contract data
  if (result.type === ClarityType.ResponseOk) {
    const contractData = cvToValue(result.value, true);
    return {
      success: true,
      message: "Contract data retrieved successfully",
      data: contractData,
    };
  } else {
    const errorMessage = `Failed to retrieve contract data: ${JSON.stringify(
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
