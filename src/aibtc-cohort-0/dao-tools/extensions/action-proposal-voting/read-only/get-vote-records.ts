import {
  Cl,
  fetchCallReadOnlyFunction,
  cvToJSON,
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
  "Usage: bun run get-vote-records.ts <daoActionProposalVotingContract> <proposalId> <voterAddress>";
const usageExample =
  "Example: bun run get-vote-records.ts ST000000000000000000002AMW42H.aibtc-action-proposal-voting 1 ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5";

interface ExpectedArgs {
  daoActionProposalVotingContract: string;
  proposalId: number;
  voterAddress: string;
}

interface VoteRecordData {
  vote: boolean;
  amount: string; // uint as string
}

interface VoteRecordsResponse {
  voteRecord: VoteRecordData | null;
  vetoVoteRecord: string | null; // uint as string or null
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

async function main(): Promise<ToolResponse<VoteRecordsResponse>> {
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
    functionName: "get-vote-records",
    functionArgs: [Cl.uint(args.proposalId), Cl.principal(args.voterAddress)],
    senderAddress,
    network: networkObj,
  });

  const jsonResponse = cvToJSON(result);
  console.log(
    "Raw data from contract call:",
    JSON.stringify(jsonResponse, null, 2)
  );

  const rawData = jsonResponse.value;

  // Correctly access properties using camelCase as converted by cvToJSON
  const voteRecordOptional = rawData.voteRecord.value;
  const vetoVoteRecordOptional = rawData.vetoVoteRecord.value;

  const responseData: VoteRecordsResponse = {
    voteRecord: voteRecordOptional
      ? {
          vote: voteRecordOptional.value.vote.value,
          amount: voteRecordOptional.value.amount.value,
        }
      : null,
    vetoVoteRecord: vetoVoteRecordOptional
      ? vetoVoteRecordOptional.value
      : null,
  };

  return {
    success: true,
    message: "Vote records retrieved successfully.",
    data: responseData,
  };
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
