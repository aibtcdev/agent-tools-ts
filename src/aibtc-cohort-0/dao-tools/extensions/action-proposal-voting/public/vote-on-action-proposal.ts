import {
  Cl,
  makeContractCall,
  SignedContractCallOptions,
  PostConditionMode, // Though not strictly needed here, good for consistency
} from "@stacks/transactions";
import {
  broadcastTx,
  CONFIG,
  convertStringToBoolean,
  createErrorResponse,
  deriveChildAccount,
  getNetwork,
  getNextNonce,
  sendToLLM,
  ToolResponse,
  validateStacksAddress,
  isValidContractPrincipal,
} from "../../../../../utilities";

const usage =
  "Usage: bun run vote-on-action-proposal.ts <daoActionProposalVotingContract> <proposalId> <voteFor (true/false)>";
const usageExample =
  "Example: bun run vote-on-action-proposal.ts ST000000000000000000002AMW42H.aibtc-action-proposal-voting 1 true";

interface ExpectedArgs {
  daoActionProposalVotingContract: string;
  proposalId: number;
  voteFor: boolean;
}

function validateArgs(): ExpectedArgs {
  const [daoActionProposalVotingContract, proposalIdStr, voteForStr] =
    process.argv.slice(2);

  if (
    !daoActionProposalVotingContract ||
    proposalIdStr === undefined ||
    voteForStr === undefined
  ) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  if (!isValidContractPrincipal(daoActionProposalVotingContract)) {
    const errorMessage = [
      `Invalid DAO Action Proposal Voting contract: ${daoActionProposalVotingContract}`,
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

  const voteFor = convertStringToBoolean(voteForStr);
  if (voteFor === undefined) {
    const errorMessage = [
      `Invalid voteFor value: ${voteForStr}. Must be 'true' or 'false'.`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  return {
    daoActionProposalVotingContract,
    proposalId,
    voteFor,
  };
}

async function main() {
  const args = validateArgs();
  const [extensionAddress, extensionName] =
    args.daoActionProposalVotingContract.split(".");

  const networkObj = getNetwork(CONFIG.NETWORK);
  const { address, key } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  const nextPossibleNonce = await getNextNonce(CONFIG.NETWORK, address);

  const functionArgs = [Cl.uint(args.proposalId), Cl.bool(args.voteFor)];

  const txOptions: SignedContractCallOptions = {
    contractAddress: extensionAddress,
    contractName: extensionName,
    functionName: "vote-on-action-proposal",
    functionArgs,
    network: networkObj,
    nonce: nextPossibleNonce,
    senderKey: key,
    // No direct fund transfer post-conditions from the caller for this action
    postConditionMode: PostConditionMode.Allow,
  };

  const transaction = await makeContractCall(txOptions);
  const broadcastResponse = await broadcastTx(transaction, networkObj);
  return broadcastResponse;
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
