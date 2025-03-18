import {
  callReadOnlyFunction,
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
} from "../../../../utilities";

const usage =
  "Usage: bun run get-total-votes.ts <daoCoreProposalsExtensionContract> <daoProposalContract> <voterAddress>";
const usageExample =
  "Example: bun run get-total-votes.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-core-proposals-v2 ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-onchain-messaging-send ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA";

interface ExpectedArgs {
  daoCoreProposalsExtensionContract: string;
  daoProposalContract: string;
  voterAddress: string;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [daoCoreProposalsExtensionContract, daoProposalContract, voterAddress] =
    process.argv.slice(2);
  if (
    !daoCoreProposalsExtensionContract ||
    !daoProposalContract ||
    !voterAddress
  ) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // verify contract addresses extracted from arguments
  const [coreExtensionAddress, coreExtensionName] =
    daoCoreProposalsExtensionContract.split(".");
  const [proposalAddress, proposalName] = daoProposalContract.split(".");
  if (
    !coreExtensionAddress ||
    !coreExtensionName ||
    !proposalAddress ||
    !proposalName
  ) {
    const errorMessage = [
      `Invalid contract addresses: ${daoCoreProposalsExtensionContract} ${daoProposalContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // return validated arguments
  return {
    daoCoreProposalsExtensionContract,
    daoProposalContract,
    voterAddress,
  };
}

// gets total votes from core proposal contract for a given voter
async function main(): Promise<ToolResponse<number>> {
  // validate and store provided args
  const args = validateArgs();
  const [extensionAddress, extensionName] =
    args.daoCoreProposalsExtensionContract.split(".");
  // setup network and wallet info
  const networkObj = getNetwork(CONFIG.NETWORK);
  const { address } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  // get total votes
  const result = await callReadOnlyFunction({
    contractAddress: extensionAddress,
    contractName: extensionName,
    functionName: "get-total-votes",
    functionArgs: [
      principalCV(args.daoProposalContract),
      principalCV(args.voterAddress),
    ],
    senderAddress: address,
    network: networkObj,
  });
  // return total proposals
  const response: ToolResponse<number> = {
    success: true,
    message: "Retrieved total proposals successfully",
    data: parseInt(cvToValue(result)),
  };
  return response;
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
