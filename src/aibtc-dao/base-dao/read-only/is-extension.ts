import {
  fetchCallReadOnlyFunction,
  cvToValue,
  principalCV,
} from "@stacks/transactions";
import {
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  getNetwork,
  sendToLLM,
  ToolResponse,
} from "../../../utilities";

const usage =
  "Usage: bun run is-extension.ts <baseDaoContract> <extensionContract>";
const usageExample =
  "Example: bun run is-extension.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-base-dao ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-action-proposals-v2";

interface ExpectedArgs {
  baseDaoContract: string;
  extensionContract: string;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [baseDaoContract, extensionContract] = process.argv.slice(2);
  if (!baseDaoContract || !extensionContract) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // verify contract addresses extracted from arguments
  const [daoAddress, daoName] = baseDaoContract.split(".");
  const [extensionAddress, extensionName] = extensionContract.split(".");
  if (!daoAddress || !daoName || !extensionAddress || !extensionName) {
    const errorMessage = [
      `Invalid contract addresses: ${baseDaoContract} ${extensionContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // return validated arguments
  return {
    baseDaoContract,
    extensionContract,
  };
}

async function main(): Promise<ToolResponse<boolean>> {
  // validate and store provided args
  const args = validateArgs();
  const [daoAddress, daoName] = args.baseDaoContract.split(".");
  const [extensionAddress, extensionName] = args.extensionContract.split(".");
  // setup network and wallet info
  const networkObj = getNetwork(CONFIG.NETWORK);
  const { address } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  // call read-only function
  const result = await fetchCallReadOnlyFunction({
    contractAddress: daoAddress,
    contractName: daoName,
    functionName: "is-extension",
    functionArgs: [principalCV(`${extensionAddress}.${extensionName}`)],
    senderAddress: address,
    network: networkObj,
  });
  // extract and return extension status
  const isExtension = cvToValue(result, true);
  return {
    success: true,
    message: "Extension status retrieved successfully",
    data: isExtension,
  };
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
