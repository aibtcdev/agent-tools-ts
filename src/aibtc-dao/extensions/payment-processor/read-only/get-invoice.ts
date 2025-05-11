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
  isValidContractPrincipal,
  sendToLLM,
  ToolResponse,
} from "../../../../utilities";

const usage =
  "Usage: bun run get-invoice.ts <paymentProcessorContract> <invoiceIndex>";
const usageExample =
  "Example: bun run get-invoice.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-payment-processor-stx 1";

interface ExpectedArgs {
  paymentProcessorContract: string;
  invoiceIndex: number;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [paymentProcessorContract, invoiceIndexStr] = process.argv.slice(2);
  const invoiceIndex = parseInt(invoiceIndexStr);
  if (!paymentProcessorContract || !invoiceIndex) {
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
    invoiceIndex,
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
  // get invoice data
  const result = await fetchCallReadOnlyFunction({
    contractAddress,
    contractName,
    functionName: "get-invoice",
    functionArgs: [Cl.uint(args.invoiceIndex)],
    senderAddress: address,
    network: networkObj,
  });
  // extract and return invoice data
  if (result.type === ClarityType.OptionalSome) {
    const invoiceData = cvToValue(result.value, true);
    return {
      success: true,
      message: "Invoice data retrieved successfully",
      data: invoiceData,
    };
  } else {
    const errorMessage = `Invoice not found: ${args.invoiceIndex}`;
    throw new Error(errorMessage);
  }
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
