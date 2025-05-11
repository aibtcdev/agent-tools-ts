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
  sendToLLM,
  ToolResponse,
} from "../../../../utilities";

const usage = "Usage: bun run get-account-terms.ts <timedVaultContract>";
const usageExample =
  "Example: bun run get-account-terms.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-timed-vault";

interface ExpectedArgs {
  timedVaultContract: string;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [timedVaultContract] = process.argv.slice(2);
  if (!timedVaultContract) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // verify contract addresses extracted from arguments
  const [contractAddress, contractName] = timedVaultContract.split(".");
  if (!contractAddress || !contractName) {
    const errorMessage = [
      `Invalid contract address: ${timedVaultContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // return validated arguments
  return {
    timedVaultContract,
  };
}

async function main(): Promise<ToolResponse<any>> {
  // validate and store provided args
  const args = validateArgs();
  const [contractAddress, contractName] = args.timedVaultContract.split(".");
  // setup network and wallet info
  const networkObj = getNetwork(CONFIG.NETWORK);
  const { address } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  // get account terms
  const result = await fetchCallReadOnlyFunction({
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
