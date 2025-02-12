import {
  callReadOnlyFunction,
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

const usage = "Usage: bun run get-account-terms.ts <bankAccountContract>";
const usageExample =
  "Example: bun run get-account-terms.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtcdao-bank-account";

interface ExpectedArgs {
  bankAccountContract: string;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [bankAccountContract] = process.argv.slice(2);
  if (!bankAccountContract) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // verify contract addresses extracted from arguments
  const [contractAddress, contractName] = bankAccountContract.split(".");
  if (!contractAddress || !contractName) {
    const errorMessage = [
      `Invalid contract address: ${bankAccountContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // return validated arguments
  return {
    bankAccountContract,
  };
}

async function main(): Promise<ToolResponse<any>> {
  // validate and store provided args
  const args = validateArgs();
  const [contractAddress, contractName] = args.bankAccountContract.split(".");
  // setup network and wallet info
  const networkObj = getNetwork(CONFIG.NETWORK);
  const { address } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  // get account terms
  const result = await callReadOnlyFunction({
    contractAddress,
    contractName,
    functionName: "get-account-terms",
    functionArgs: [],
    senderAddress: address,
    network: networkObj,
  });
  // extract and return account terms
  if (result.type === ClarityType.ResponseOk) {
    const accountTerms = cvToValue(result.value, true);
    return {
      success: true,
      message: "Account terms retrieved successfully",
      data: accountTerms,
    };
  } else {
    const errorMessage = `Failed to retrieve account terms: ${JSON.stringify(
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
