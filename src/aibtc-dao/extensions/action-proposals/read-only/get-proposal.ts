import {
  callReadOnlyFunction,
  Cl,
  ClarityType,
  cvToJSON,
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
  "Usage: bun run get-proposal.ts <daoActionProposalsExtensionContract> <proposalId>";
const usageExample =
  "Example: bun run get-proposal.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-action-proposals-v2 1";

interface ExpectedArgs {
  daoActionProposalsExtensionContract: string;
  proposalId: number;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [daoActionProposalsExtensionContract, proposalIdStr] =
    process.argv.slice(2);
  const proposalId = parseInt(proposalIdStr);
  if (!daoActionProposalsExtensionContract || !proposalId) {
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
    proposalId,
  };
}

// gets action proposal info from contract
// TODO: type this based on Proposals map
async function main(): Promise<ToolResponse<any>> {
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
  // get the proposal
  const result = await callReadOnlyFunction({
    contractAddress: extensionAddress,
    contractName: extensionName,
    functionName: "get-proposal",
    functionArgs: [Cl.uint(args.proposalId)],
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
