import {
  callReadOnlyFunction,
  Cl,
  cvToValue,
  validateStacksAddress,
} from "@stacks/transactions";
import {
  CONFIG,
  deriveChildAccount,
  getNetwork,
  sendToLLM,
  ToolResponse,
} from "../../../../utilities";

const usage =
  "Usage: bun run get-voting-power.ts <daoActionProposalsExtensionContractAddress> <proposalId> <voterAddress>";
const usageExample =
  "Example: bun run get-voting-power.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.wed-action-proposals-v2 1 ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA";

interface ExpectedArgs {
  daoActionProposalsExtensionContract: string;
  proposalId: number;
  voterAddress: string;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [daoActionProposalsExtensionContract, proposalIdStr, voterAddress] =
    process.argv.slice(2);
  const proposalId = parseInt(proposalIdStr);
  if (!daoActionProposalsExtensionContract || !proposalId || !voterAddress) {
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
  // verify address is valid
  if (!validateStacksAddress(voterAddress)) {
    const errorMessage = [
      `Invalid voter address: ${voterAddress}`,
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

// gets voting power for an address on a proposal
async function main() {
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
  // get voting power
  const result = await callReadOnlyFunction({
    contractAddress: extensionAddress,
    contractName: extensionName,
    functionName: "get-voting-power",
    functionArgs: [Cl.principal(args.voterAddress), Cl.uint(args.proposalId)],
    senderAddress: address,
    network: networkObj,
  });

  const parsedResult = parseInt(cvToValue(result, true));
  if (isNaN(parsedResult)) {
    throw new Error(`Failed to parse voting power from result: ${result}`);
  }
  const response: ToolResponse<any> = {
    success: true,
    message: "Retrieved voting power successfully",
    data: parsedResult,
  };
  return response;
}

main()
  .then((response) => {
    sendToLLM(response);
    process.exit(0);
  })
  .catch((error) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorData = error instanceof Error ? error : undefined;
    const response: ToolResponse<Error | undefined> = {
      success: false,
      message: errorMessage,
      data: errorData,
    };
    sendToLLM(response);
    process.exit(1);
  });
