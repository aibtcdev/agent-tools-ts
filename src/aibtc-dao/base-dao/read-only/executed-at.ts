import {
  callReadOnlyFunction,
  cvToValue,
  contractPrincipalCV,
} from "@stacks/transactions";
import {
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  getNetwork,
  sendToLLM,
  ToolResponse,
} from "../../../utilities";

const usage =
  "Usage: bun run executed-at.ts <baseDaoContract> <proposalContract>";
const usageExample =
  "Example: bun run executed-at.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-base-dao ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-onchain-messaging-send";

interface ExpectedArgs {
  baseDaoContract: string;
  proposalContract: string;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [baseDaoContract, proposalContract] = process.argv.slice(2);
  if (!baseDaoContract || !proposalContract) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // verify contract addresses extracted from arguments
  const [daoAddress, daoName] = baseDaoContract.split(".");
  const [proposalAddress, proposalName] = proposalContract.split(".");
  if (!daoAddress || !daoName || !proposalAddress || !proposalName) {
    const errorMessage = [
      `Invalid contract addresses: ${baseDaoContract} ${proposalContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // return validated arguments
  return {
    baseDaoContract,
    proposalContract,
  };
}

async function main(): Promise<ToolResponse<number | null>> {
  // validate and store provided args
  const args = validateArgs();
  const [daoAddress, daoName] = args.baseDaoContract.split(".");
  const [proposalAddress, proposalName] = args.proposalContract.split(".");
  // setup network and wallet info
  const networkObj = getNetwork(CONFIG.NETWORK);
  const { address } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  // call read-only function
  const result = await callReadOnlyFunction({
    contractAddress: daoAddress,
    contractName: daoName,
    functionName: "executed-at",
    functionArgs: [contractPrincipalCV(proposalAddress, proposalName)],
    senderAddress: address,
    network: networkObj,
  });
  // extract and return block height
  const executedAt = cvToValue(result, true);
  return {
    success: true,
    message: "Proposal execution block height retrieved successfully",
    data: executedAt,
  };
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
