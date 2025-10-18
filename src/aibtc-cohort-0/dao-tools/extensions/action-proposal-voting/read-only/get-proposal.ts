import {
  fetchCallReadOnlyFunction,
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
} from "../../../../../utilities";

const usage =
  "Usage: bun run get-proposal.ts <daoActionProposalVotingContract> <proposalId>";
const usageExample =
  "Example: bun run get-proposal.ts ST000000000000000000002AMW42H.aibtc-action-proposal-voting 1";

// Define the expected structure of the proposal data based on the Clarity contract
interface ProposalData {
  action: string; // principal
  parameters: string; // (buff 2048) - hex string
  bond: string; // uint - string representation of number
  caller: string; // principal
  creator: string; // principal
  creatorUserId: string; // uint - string representation of number
  liquidTokens: string; // uint - string representation of number
  memo?: string; // (optional (string-ascii 1024))
  createdBtc: string; // uint
  createdStx: string; // uint
  voteStart: string; // uint
  voteEnd: string; // uint
  execStart: string; // uint
  execEnd: string; // uint
  votesFor: string; // uint
  votesAgainst: string; // uint
  vetoVotes: string; // uint
  concluded: boolean;
  metQuorum: boolean;
  metThreshold: boolean;
  passed: boolean;
  executed: boolean;
  expired: boolean;
  vetoMetQuorum: boolean;
  vetoExceedsYes: boolean;
  vetoed: boolean;
}

async function main(): Promise<ToolResponse<ProposalData | null>> {
  const [daoActionProposalVotingContract, proposalIdStr] =
    process.argv.slice(2);
  if (!daoActionProposalVotingContract || proposalIdStr === undefined) {
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

  const networkObj = getNetwork(CONFIG.NETWORK);
  const { address: senderAddress } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );

  const result = await fetchCallReadOnlyFunction({
    contractAddress,
    contractName,
    functionName: "get-proposal",
    functionArgs: [Cl.uint(proposalId)],
    senderAddress,
    network: networkObj,
  });

  if (result.type === ClarityType.OptionalSome) {
    const proposal = cvToJSON(result.value).value as ProposalData; // cvToJSON wraps in a value field
    return {
      success: true,
      message: "Proposal retrieved successfully.",
      data: proposal,
    };
  } else if (result.type === ClarityType.OptionalNone) {
    return {
      success: true,
      message: "Proposal not found.",
      data: null,
    };
  } else {
    // This case should ideally not be reached if the contract returns (optional ...)
    // but good to have for robustness.
     const errorValue = (result as any).value ? cvToJSON((result as any).value) : result;
    throw new Error(
      `Error retrieving proposal: ${JSON.stringify(errorValue)}`
    );
  }
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
