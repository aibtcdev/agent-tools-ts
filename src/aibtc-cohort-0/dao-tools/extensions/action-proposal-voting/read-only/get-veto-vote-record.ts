import {
  Cl,
  fetchCallReadOnlyFunction,
  cvToValue,
  ClarityType,
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
  "Usage: bun run get-veto-vote-record.ts <daoActionProposalVotingContract> <proposalId> <voterAddress>";
const usageExample =
  "Example: bun run get-veto-vote-record.ts ST000000000000000000002AMW42H.aibtc-action-proposal-voting 1 ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5";

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

async function main(): Promise<ToolResponse<string | null>> {
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
    functionName: "get-veto-vote-record",
    functionArgs: [Cl.uint(args.proposalId), Cl.principal(args.voterAddress)],
    senderAddress,
    network: networkObj,
  });

  if (result.type === ClarityType.OptionalSome) {
    // cvToValue with true flag for Clarity uint returns a string
    const vetoVoteAmount = cvToValue(result.value, true) as string;
    return {
      success: true,
      message: "Veto vote record retrieved successfully.",
      data: vetoVoteAmount,
    };
  } else if (result.type === ClarityType.OptionalNone) {
    return {
      success: true,
      message: "Veto vote record not found for the given proposal ID and voter.",
      data: null,
    };
  } else {
    const errorValue = (result as any).value ? cvToValue((result as any).value, true) : result;
    throw new Error(
      `Error retrieving veto vote record: ${JSON.stringify(errorValue)}`
    );
  }
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
