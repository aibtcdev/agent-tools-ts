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
  sendToLLM,
  ToolResponse,
} from "../../../../utilities";

const usage =
  "Usage: bun run get-dao-charter.ts <daoCharterContract> <version>";
const usageExample =
  "Example: bun run get-dao-charter.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-charter 1";

interface ExpectedArgs {
  daoCharterContract: string;
  version: number;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [daoCharterContract, versionStr] = process.argv.slice(2);
  const version = parseInt(versionStr);
  if (!daoCharterContract || !version) {
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
  // verify version is positive
  if (version <= 0) {
    const errorMessage = [
      `Invalid version: ${version}. Version must be positive.`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // return validated arguments
  return {
    daoCharterContract,
    version,
  };
}

async function main(): Promise<ToolResponse<any | null>> {
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
  // get charter version data
  const result = await fetchCallReadOnlyFunction({
    contractAddress,
    contractName,
    functionName: "get-dao-charter",
    functionArgs: [Cl.uint(args.version)],
    senderAddress: address,
    network: networkObj,
  });
  // extract and return charter data
  if (result.type === ClarityType.OptionalSome) {
    const charterData = cvToValue(result.value, true);
    return {
      success: true,
      message: "DAO charter data retrieved successfully",
      data: charterData,
    };
  } else {
    return {
      success: true,
      message: `No DAO charter found for version ${args.version}`,
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
