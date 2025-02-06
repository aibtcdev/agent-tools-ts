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
  "Usage: bun run get-invoice.ts <paymentsInvoicesContract> <invoiceIndex>";
const usageExample =
  "Example: bun run get-invoice.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtcdao-payments-invoices 1";

interface ExpectedArgs {
  paymentsInvoicesContract: string;
  invoiceIndex: number;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [paymentsInvoicesContract, invoiceIndexStr] = process.argv.slice(2);
  const invoiceIndex = parseInt(invoiceIndexStr);
  if (!paymentsInvoicesContract || !invoiceIndex) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // verify contract addresses extracted from arguments
  const [contractAddress, contractName] = paymentsInvoicesContract.split(".");
  if (!contractAddress || !contractName) {
    const errorMessage = [
      `Invalid contract address: ${paymentsInvoicesContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // return validated arguments
  return {
    paymentsInvoicesContract,
    invoiceIndex,
  };
}

async function main(): Promise<ToolResponse<any>> {
  // validate and store provided args
  const args = validateArgs();
  const [contractAddress, contractName] = args.paymentsInvoicesContract.split(".");
  // setup network and wallet info
  const networkObj = getNetwork(CONFIG.NETWORK);
  const { address } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  // get invoice data
  const result = await callReadOnlyFunction({
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
