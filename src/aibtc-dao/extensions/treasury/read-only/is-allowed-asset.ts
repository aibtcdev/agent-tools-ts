import {
  callReadOnlyFunction,
  Cl,
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
  "Usage: bun run is-allowed-asset.ts <treasuryContract> <assetContract>";
const usageExample =
  "Example: bun run is-allowed-asset.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtcdao-treasury ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.token-ft";

interface ExpectedArgs {
  treasuryContract: string;
  assetContract: string;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [treasuryContract, assetContract] = process.argv.slice(2);
  if (!treasuryContract || !assetContract) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // verify contract addresses extracted from arguments
  const [treasuryAddress, treasuryName] = treasuryContract.split(".");
  const [assetAddress, assetName] = assetContract.split(".");
  if (!treasuryAddress || !treasuryName || !assetAddress || !assetName) {
    const errorMessage = [
      `Invalid contract addresses: ${treasuryContract} ${assetContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // return validated arguments
  return {
    treasuryContract,
    assetContract,
  };
}

async function main(): Promise<ToolResponse<boolean>> {
  // validate and store provided args
  const args = validateArgs();
  const [contractAddress, contractName] = args.treasuryContract.split(".");
  // setup network and wallet info
  const networkObj = getNetwork(CONFIG.NETWORK);
  const { address } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  // get allowed asset status
  const result = await callReadOnlyFunction({
    contractAddress,
    contractName,
    functionName: "is-allowed-asset",
    functionArgs: [Cl.principal(args.assetContract)],
    senderAddress: address,
    network: networkObj,
  });
  // extract and return allowed status
  const isAllowed = cvToValue(result, true);
  return {
    success: true,
    message: "Asset allowed status retrieved successfully",
    data: isAllowed,
  };
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
