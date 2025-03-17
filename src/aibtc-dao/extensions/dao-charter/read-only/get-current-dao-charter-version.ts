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

const usage =
  "Usage: bun run get-current-dao-charter-version.ts <daoCharterContract>";
const usageExample =
  "Example: bun run get-current-dao-charter-version.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-charter";

interface ExpectedArgs {
  daoCharterContract: string;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [daoCharterContract] = process.argv.slice(2);
  if (!daoCharterContract) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // verify contract addresses extracted from arguments
  const [contractAddress, contractName] = daoCharterContract.split(".");
  if (!contractAddress || !contractName) {
    const errorMessage = [
      `Invalid contract address: ${daoCharterContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // return validated arguments
  return {
    daoCharterContract,
  };
}

async function main(): Promise<ToolResponse<number | null>> {
  // validate and store provided args
  const args = validateArgs();
  const [contractAddress, contractName] = args.daoCharterContract.split(".");
  // setup network and wallet info
  const networkObj = getNetwork(CONFIG.NETWORK);
  const { address } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  // get current version
  const result = await callReadOnlyFunction({
    contractAddress,
    contractName,
    functionName: "get-current-dao-charter-version",
    functionArgs: [],
    senderAddress: address,
    network: networkObj,
  });
  // extract and return version
  if (result.type === ClarityType.OptionalSome) {
    const version = cvToValue(result.value, true);
    return {
      success: true,
      message: "Current DAO charter version retrieved successfully",
      data: version,
    };
  } else {
    return {
      success: true,
      message: "No DAO charter version found",
      data: null,
    };
  }
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
