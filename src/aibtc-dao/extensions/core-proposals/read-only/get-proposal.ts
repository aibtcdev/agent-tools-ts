import {
  fetchCallReadOnlyFunction,
  ClarityType,
  cvToJSON,
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
  "Usage: bun run get-proposal.ts <daoCoreProposalsExtensionContract> <daoProposalContract>";
const usageExample =
  "Example: bun run get-proposal.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-core-proposals-v2 ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-base-bootstrap-initialization";

interface ExpectedArgs {
  daoCoreProposalsExtensionContract: string;
  daoProposalContract: string;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [daoCoreProposalsExtensionContract, daoProposalContract] =
    process.argv.slice(2);
  if (!daoCoreProposalsExtensionContract || !daoProposalContract) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // verify contract addresses extracted from arguments
  const [extensionAddress, extensionName] =
    daoCoreProposalsExtensionContract.split(".");
  const [proposalAddress, proposalName] = daoProposalContract.split(".");
  if (
    !extensionAddress ||
    !extensionName ||
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
    daoCoreProposalsExtensionContract: daoCoreProposalsExtensionContract,
    daoProposalContract: daoProposalContract,
  };
}

// gets core proposal info from contract
async function main(): Promise<ToolResponse<unknown>> {
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
  // get the proposal
  const result = await fetchCallReadOnlyFunction({
    contractAddress: extensionAddress,
    contractName: extensionName,
    functionName: "get-proposal",
    functionArgs: [principalCV(args.daoProposalContract)],
    senderAddress: address,
    network: networkObj,
  });
  // extract and return proposal
  if (result.type === ClarityType.OptionalSome) {
    const proposal = cvToJSON(result.value);
    return {
      success: true,
      message: "Proposal retrieved successfully",
      data: proposal,
    };
  } else if (result.type === ClarityType.OptionalNone) {
    return {
      success: true,
      message: "Proposal not found",
      data: null,
    };
  } else {
    const errorMessage = `Error retrieving proposal: ${JSON.stringify(result)}`;
    throw new Error(errorMessage);
  }
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
