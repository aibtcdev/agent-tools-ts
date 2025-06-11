import {
  Cl,
  makeContractCall,
  SignedContractCallOptions,
  PostConditionMode,
} from "@stacks/transactions";
import {
  broadcastSponsoredTx,
  CONFIG,
  convertStringToBoolean,
  createErrorResponse,
  deriveChildAccount,
  getNetwork,
  getNextNonce,
  isValidContractPrincipal,
  sendToLLM,
} from "../../../utilities";

const usage =
  "Usage: bun run vote-on-action-proposal.ts <agentAccountContract> <votingContract> <proposalId> <vote>";
const usageExample =
  "Example: bun run vote-on-action-proposal.ts ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-agent-account-test ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-action-proposals-v2 1 true";

interface ExpectedArgs {
  agentAccountContract: string;
  votingContract: string;
  proposalId: number;
  vote: boolean;
}

function validateArgs(): ExpectedArgs {
  const [agentAccountContract, votingContract, proposalIdStr, voteStr] =
    process.argv.slice(2);
  const proposalId = parseInt(proposalIdStr);
  let vote: boolean;

  if (
    !agentAccountContract ||
    !votingContract ||
    !proposalIdStr ||
    isNaN(proposalId) ||
    voteStr === undefined
  ) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  try {
    vote = convertStringToBoolean(voteStr);
  } catch (e: any) {
    const errorMessage = [
      `Invalid vote value: ${voteStr}. Must be true or false.`,
      e.message,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  if (!isValidContractPrincipal(agentAccountContract)) {
    const errorMessage = [
      `Invalid agent account contract address: ${agentAccountContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  if (!isValidContractPrincipal(votingContract)) {
    const errorMessage = [
      `Invalid voting contract address: ${votingContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  return {
    agentAccountContract,
    votingContract,
    proposalId,
    vote,
  };
}

async function main() {
  const args = validateArgs();
  const [contractAddress, contractName] = args.agentAccountContract.split(".");

  const networkObj = getNetwork(CONFIG.NETWORK);
  const { address, key } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );

  const nextPossibleNonce = await getNextNonce(CONFIG.NETWORK, address);

  const functionArgs = [
    Cl.principal(args.votingContract),
    Cl.uint(args.proposalId),
    Cl.bool(args.vote),
  ];

  const txOptions: SignedContractCallOptions = {
    contractAddress,
    contractName,
    functionName: "vote-on-action-proposal",
    functionArgs,
    network: networkObj,
    nonce: nextPossibleNonce,
    senderKey: key,
    postConditionMode: PostConditionMode.Deny, // Or .Allow if no specific conditions
    postConditions: [], // Typically no direct asset transfers for voting
    fee: 0,
    sponsored: true,
  };

  try {
    const transaction = await makeContractCall(txOptions);
    const broadcastResponse = await broadcastSponsoredTx(
      transaction,
      networkObj
    );
    return broadcastResponse;
  } catch (error) {
    const errorMessage = [
      `Error voting on action proposal via agent account:`,
      `${error instanceof Error ? error.message : String(error)}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
