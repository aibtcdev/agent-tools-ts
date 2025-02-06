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
  "Usage: bun run get-user-data-by-address.ts <paymentsInvoicesContract> <userAddress>";
const usageExample =
  "Example: bun run get-user-data-by-address.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtcdao-payments-invoices ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA";

interface ExpectedArgs {
  paymentsInvoicesContract: string;
  userAddress: string;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [paymentsInvoicesContract, userAddress] = process.argv.slice(2);
  if (!paymentsInvoicesContract || !userAddress) {
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
    userAddress,
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
  // get user data
  const result = await callReadOnlyFunction({
    contractAddress,
    contractName,
    functionName: "get-user-data-by-address",
    functionArgs: [Cl.principal(args.userAddress)],
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
    const errorMessage = `User not found: ${args.userAddress}`;
    throw new Error(errorMessage);
  }
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
