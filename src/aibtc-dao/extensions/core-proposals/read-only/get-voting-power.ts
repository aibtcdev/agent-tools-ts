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
  "Usage: bun run get-voting-power.ts <daoCoreProposalsExtensionContractAddress> <daoProposalContract> <voterAddress>";
const usageExample =
  "Example: bun run get-voting-power.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-action-proposals ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-onchain-messaging-send ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA";

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
    daoCoreProposalsExtensionContract,
    daoProposalContract,
    voterAddress,
  };
}

// gets voting power for an address on a proposal
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
  // get voting power
  const result = await fetchCallReadOnlyFunction({
    contractAddress: extensionAddress,
    contractName: extensionName,
    functionName: "get-voting-power",
    functionArgs: [
      Cl.principal(args.voterAddress),
      Cl.principal(args.daoProposalContract),
    ],
    senderAddress: address,
    network: networkObj,
  });
  // extract and return voting power
  if (result.type === ClarityType.ResponseOk) {
    const parsedResult = parseInt(cvToValue(result, true));
    if (isNaN(parsedResult)) {
      throw new Error(`Failed to parse voting power from result: ${result}`);
    }
    const response: ToolResponse<number> = {
      success: true,
      message: "Retrieved voting power successfully",
      data: parsedResult,
    };
    return response;
  } else {
    const errorMessage = `Error retrieving voting power: ${JSON.stringify(
      result
    )}`;
    throw new Error(errorMessage);
  }
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
