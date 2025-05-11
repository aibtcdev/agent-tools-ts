import { fetchCallReadOnlyFunction, cvToValue } from "@stacks/transactions";
import {
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  getNetwork,
  sendToLLM,
  ToolResponse,
} from "../../../../utilities";

const usage =
  "Usage: bun run get-proposal-bond.ts <daoActionProposalsExtensionContract>";
const usageExample =
  "Example: bun run get-proposal-bond.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-action-proposals-v2";

interface ExpectedArgs {
  daoActionProposalsExtensionContract: string;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [daoActionProposalsExtensionContract] = process.argv.slice(2);
  if (!daoActionProposalsExtensionContract) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // verify contract addresses extracted from arguments
  const [extensionAddress, extensionName] =
    daoActionProposalsExtensionContract.split(".");
  if (!extensionAddress || !extensionName) {
    const errorMessage = [
      `Invalid contract address: ${daoActionProposalsExtensionContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // return validated arguments
  return {
    daoActionProposalsExtensionContract,
  };
}

async function main(): Promise<ToolResponse<number>> {
  // validate and store provided args
  const args = validateArgs();
  const [extensionAddress, extensionName] =
    args.daoActionProposalsExtensionContract.split(".");
  // setup network and wallet info
  const networkObj = getNetwork(CONFIG.NETWORK);
  const { address } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  // call read-only function
  const result = await fetchCallReadOnlyFunction({
    contractAddress: extensionAddress,
    contractName: extensionName,
    functionName: "get-proposal-bond",
    functionArgs: [],
    senderAddress: address,
    network: networkObj,
  });
  // extract and return response
  const proposalBond = parseInt(cvToValue(result, true));
  if (isNaN(proposalBond)) {
    throw new Error(`Failed to retrieve proposal bond: ${result}`);
  }
  return {
    success: true,
    message: "Proposal bond successfully retrieved",
    data: proposalBond,
  };
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
