import { fetchCallReadOnlyFunction, cvToValue } from "@stacks/transactions";
import {
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  getNetwork,
  isValidContractPrincipal,
  sendToLLM,
  ToolResponse,
} from "../../../utilities";

const usage = "Usage: bun run get-configuration.ts <smartWalletContract>";
const usageExample =
  "Example: bun run get-configuration.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-user-agent-smart-wallet";

interface ExpectedArgs {
  smartWalletContract: string;
}

interface WalletConfiguration {
  agent: string;
  user: string;
  smartWallet: string;
  daoToken: string;
  sbtcToken: string;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [smartWalletContract] = process.argv.slice(2);
  if (!smartWalletContract) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // verify contract addresses extracted from arguments
  if (!isValidContractPrincipal(smartWalletContract)) {
    const errorMessage = [
      `Invalid contract address: ${smartWalletContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // return validated arguments
  return {
    smartWalletContract,
  };
}

async function main(): Promise<ToolResponse<WalletConfiguration>> {
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
  // get wallet configuration
  const result = await fetchCallReadOnlyFunction({
    contractAddress,
    contractName,
    functionName: "get-configuration",
    functionArgs: [],
    senderAddress: address,
    network: networkObj,
  });
  // extract and return configuration
  const configuration = cvToValue(result);
  return {
    success: true,
    message: "Smart wallet configuration retrieved successfully",
    data: configuration,
  };
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
