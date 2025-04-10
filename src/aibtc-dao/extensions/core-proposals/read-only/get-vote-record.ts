import { Cl, callReadOnlyFunction, cvToValue } from "@stacks/transactions";
import {
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  getNetwork,
  sendToLLM,
  ToolResponse,
} from "../../../../utilities";

const usage =
  "Usage: bun run get-vote-record.ts <daoCoreProposalsExtensionContract> <proposalContract> <voterAddress>";
const usageExample =
  "Example: bun run get-vote-record.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-core-proposals-v2 ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-onchain-messaging-send ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA";

interface ExpectedArgs {
  daoCoreProposalsExtensionContract: string;
  proposalContract: string;
  voterAddress: string;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [daoCoreProposalsExtensionContract, proposalContract, voterAddress] =
    process.argv.slice(2);
  if (!daoCoreProposalsExtensionContract || !proposalContract || !voterAddress) {
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
  if (!extensionAddress || !extensionName) {
    const errorMessage = [
      `Invalid contract address: ${daoCoreProposalsExtensionContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // verify contract addresses extracted from arguments
  const [proposalAddress, proposalName] = proposalContract.split(".");
  if (!proposalAddress || !proposalName) {
    const errorMessage = [
      `Invalid proposal contract address: ${proposalContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  
  // return validated arguments
  return {
    daoCoreProposalsExtensionContract,
    proposalContract,
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
  // configure read-only function call
  const result = await callReadOnlyFunction({
    contractAddress: extensionAddress,
    contractName: extensionName,
    functionName: "get-vote-record",
    functionArgs: [Cl.principal(args.proposalContract), Cl.principal(args.voterAddress)],
    senderAddress: address,
    network: networkObj,
  });
  // return total votes
  const totalVotes = parseInt(cvToValue(result));
  if (isNaN(totalVotes)) {
    throw new Error(`Failed to parse total votes: ${result}`);
  }
  return {
    success: true,
    message: "Votes retrieved successfully",
    data: totalVotes,
  };
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
