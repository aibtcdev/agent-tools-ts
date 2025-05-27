import {
  fetchCallReadOnlyFunction,
  Cl,
  ClarityType,
  cvToValue,
  validateStacksAddress,
} from "@stacks/transactions";
import {
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  getNetwork,
  sendToLLM,
  ToolResponse,
} from "../../../../../utilities";

const usage =
  "Usage: bun run get-voting-power.ts <daoActionProposalVotingContract> <proposalId> <voterAddress>";
const usageExample =
  "Example: bun run get-voting-power.ts ST000000000000000000002AMW42H.aibtc-action-proposal-voting 1 ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5";

interface ExpectedArgs {
  daoActionProposalVotingContract: string;
  proposalId: number;
  voterAddress: string;
}

function validateArgs(): ExpectedArgs {
  const [daoActionProposalVotingContract, proposalIdStr, voterAddress] =
    process.argv.slice(2);
  if (
    !daoActionProposalVotingContract ||
    proposalIdStr === undefined ||
    !voterAddress
  ) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  const proposalId = parseInt(proposalIdStr);
  if (isNaN(proposalId)) {
    const errorMessage = [
      `Invalid proposalId: ${proposalIdStr}. Must be a number.`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  const [contractAddress, contractName] =
    daoActionProposalVotingContract.split(".");
  if (!contractAddress || !contractName) {
    const errorMessage = [
      `Invalid contract address: ${daoActionProposalVotingContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  if (!validateStacksAddress(voterAddress)) {
    const errorMessage = [
      `Invalid voter address: ${voterAddress}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  return {
    daoActionProposalVotingContract,
    proposalId,
    voterAddress,
  };
}

async function main(): Promise<ToolResponse<number>> {
  const args = validateArgs();
  const [contractAddress, contractName] =
    args.daoActionProposalVotingContract.split(".");
  const networkObj = getNetwork(CONFIG.NETWORK);
  const { address: senderAddress } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );

  const result = await fetchCallReadOnlyFunction({
    contractAddress,
    contractName,
    functionName: "get-voting-power",
    functionArgs: [Cl.uint(args.proposalId), Cl.principal(args.voterAddress)],
    senderAddress,
    network: networkObj,
  });

  if (result.type === ClarityType.ResponseOk) {
    const votingPower = parseInt(cvToValue(result.value, true));
    if (isNaN(votingPower)) {
      throw new Error(
        `Failed to parse voting power from result: ${JSON.stringify(result)}`
      );
    }
    return {
      success: true,
      message: "Retrieved voting power successfully.",
      data: votingPower,
    };
  } else if (result.type === ClarityType.ResponseErr) {
    const errorValue = cvToValue(result.value);
    throw new Error(
      `Error retrieving voting power: ${JSON.stringify(
        errorValue
      )} (Error Code: ${errorValue})`
    );
  } else {
    throw new Error(
      `Unexpected response type: ${JSON.stringify(result)}`
    );
  }
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
