import {
  Cl,
  makeContractCall,
  SignedContractCallOptions,
  PostConditionMode,
} from "@stacks/transactions";
import {
  CONFIG,
  convertStringToBoolean,
  createErrorResponse,
  deriveChildAccount,
  getNetwork,
  getNextNonce,
  sendToLLM,
  isValidContractPrincipal,
  broadcastSponsoredTx,
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
    postConditionMode: PostConditionMode.Allow,
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
      `Error voting on action proposal:`,
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
