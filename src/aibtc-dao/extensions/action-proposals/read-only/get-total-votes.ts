import { AnchorMode, Cl, callReadOnlyFunction } from "@stacks/transactions";
import {
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  getNetwork,
  sendToLLM,
} from "../../../../utilities";

const usage =
  "Usage: bun run get-total-votes.ts <daoActionProposalsExtensionContract> <proposalId> <voterAddress>";
const usageExample =
  'Example: bun run get-total-votes.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.wed-action-proposals-v2 1 ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA';

interface ExpectedArgs {
  daoActionProposalsExtensionContract: string;
  proposalId: number;
  voterAddress: string;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [
    daoActionProposalsExtensionContract,
    proposalIdStr,
    voterAddress,
  ] = process.argv.slice(2);
  const proposalId = parseInt(proposalIdStr);
  if (
    !daoActionProposalsExtensionContract ||
    !proposalId ||
    !voterAddress
  ) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    sendToLLM({
      success: false,
      message: errorMessage,
    });
    process.exit(1);
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
    sendToLLM({
      success: false,
      message: errorMessage,
    });
    process.exit(1);
  }
  // return validated arguments
  return {
    daoActionProposalsExtensionContract,
    proposalId,
    voterAddress,
  };
}

// gets total votes from core proposal contract for a given voter
async function main() {
  // validate and store provided args
  const args = validateArgs();
  const [extensionAddress, extensionName] =
    args.daoActionProposalsExtensionContract.split(".");
  // setup network and wallet info
  const networkObj = getNetwork(CONFIG.NETWORK);
  const { address, key } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  // configure read-only function call
  const result = await callReadOnlyFunction({
    contractAddress: extensionAddress,
    contractName: extensionName,
    functionName: "get-total-votes",
    functionArgs: [
      Cl.uint(args.proposalId),
      Cl.principal(args.voterAddress),
    ],
    senderAddress: address,
    network: networkObj,
  });

  return result;
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
