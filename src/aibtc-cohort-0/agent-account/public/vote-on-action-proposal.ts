import {
  Cl,
  makeContractCall,
  SignedContractCallOptions,
  PostConditionMode,
} from "@stacks/transactions";
import {
  broadcastTx,
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
  "Usage: bun run vote-on-action-proposal.ts <agentAccountContract> <daoActionProposalVotingContract> <proposalId> <vote (true/false)>";
const usageExample =
  "Example: bun run vote-on-action-proposal.ts ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-acct-ST1PQ-PGZGM-ST35K-VM3QA ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.slow7-action-proposal-voting 13 true";

interface ExpectedArgs {
  agentAccountContract: string;
  daoActionProposalVotingContract: string;
  proposalId: number;
  vote: boolean;
}

function validateArgs(): ExpectedArgs {
  const [
    agentAccountContract,
    daoActionProposalVotingContract,
    proposalIdStr,
    voteStr,
  ] = process.argv.slice(2);

  if (
    !agentAccountContract ||
    !daoActionProposalVotingContract ||
    proposalIdStr === undefined ||
    voteStr === undefined
  ) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
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

  const vote = convertStringToBoolean(voteStr);
  if (vote === undefined) {
    const errorMessage = [
      `Invalid vote value: ${voteStr}. Must be 'true' for yes or 'false' for no.`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  return {
    agentAccountContract,
    daoActionProposalVotingContract,
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
    Cl.principal(args.daoActionProposalVotingContract),
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
    postConditionMode: PostConditionMode.Deny,
    postConditions: [],
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
