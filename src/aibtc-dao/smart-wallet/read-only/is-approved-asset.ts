import { callReadOnlyFunction, Cl, cvToValue } from "@stacks/transactions";
import {
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  getNetwork,
  sendToLLM,
  ToolResponse,
} from "../../../../utilities";

const usage = "Usage: bun run is-approved-asset.ts <smartWalletContract> <assetContract>";
const usageExample =
  "Example: bun run is-approved-asset.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-user-agent-smart-wallet ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-token";

interface ExpectedArgs {
  smartWalletContract: string;
  assetContract: string;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [smartWalletContract, assetContract] = process.argv.slice(2);
  if (!smartWalletContract || !assetContract) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // verify contract addresses extracted from arguments
  const [walletAddress, walletName] = smartWalletContract.split(".");
  const [assetAddress, assetName] = assetContract.split(".");
  if (!walletAddress || !walletName || !assetAddress || !assetName) {
    const errorMessage = [
      `Invalid contract addresses: ${smartWalletContract} ${assetContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // return validated arguments
  return {
    smartWalletContract,
    assetContract,
  };
}

async function main(): Promise<ToolResponse<boolean>> {
  // validate and store provided args
  const args = validateArgs();
  const [contractAddress, contractName] = args.smartWalletContract.split(".");
  // setup network and wallet info
  const networkObj = getNetwork(CONFIG.NETWORK);
  const { address } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  // get approved asset status
  const result = await callReadOnlyFunction({
    contractAddress,
    contractName,
    functionName: "is-approved-asset",
    functionArgs: [Cl.principal(args.assetContract)],
    senderAddress: address,
    network: networkObj,
  });
  // extract and return approved status
  const isApproved = cvToValue(result, true);
  return {
    success: true,
    message: "Asset approval status retrieved successfully",
    data: isApproved,
  };
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
