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
  "Usage: bun run get-recent-payment-data-by-address.ts <paymentsInvoicesContract> <resourceName> <userAddress>";
const usageExample =
  "Example: bun run get-recent-payment-data-by-address.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-payments-invoices resource-name ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA";

interface ExpectedArgs {
  paymentsInvoicesContract: string;
  resourceName: string;
  userAddress: string;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [paymentsInvoicesContract, resourceName, userAddress] =
    process.argv.slice(2);
  if (!paymentsInvoicesContract || !resourceName || !userAddress) {
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
    resourceName,
    userAddress,
  };
}

async function main(): Promise<ToolResponse<any>> {
  // validate and store provided args
  const args = validateArgs();
  const [contractAddress, contractName] =
    args.paymentsInvoicesContract.split(".");
  // setup network and wallet info
  const networkObj = getNetwork(CONFIG.NETWORK);
  const { address } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  // get recent payment data
  const result = await callReadOnlyFunction({
    contractAddress,
    contractName,
    functionName: "get-recent-payment-data-by-address",
    functionArgs: [
      Cl.stringUtf8(args.resourceName),
      Cl.principal(args.userAddress),
    ],
    senderAddress: address,
    network: networkObj,
  });
  // extract and return payment data
  if (result.type === ClarityType.OptionalSome) {
    const paymentData = cvToValue(result.value, true);
    return {
      success: true,
      message: "Recent payment data retrieved successfully",
      data: paymentData,
    };
  } else {
    const errorMessage = `No recent payment found for resource ${args.resourceName} and user ${args.userAddress}`;
    throw new Error(errorMessage);
  }
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
