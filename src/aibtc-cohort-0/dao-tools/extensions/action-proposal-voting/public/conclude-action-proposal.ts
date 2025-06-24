import {
  Cl,
  makeContractCall,
  Pc,
  PostConditionMode,
  SignedContractCallOptions,
} from "@stacks/transactions";
import {
  broadcastTx,
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  getNetwork,
  getNextNonce,
  sendToLLM,
  isValidContractPrincipal,
  getCurrentActionProposalBond,
  getBondFromActionProposal,
} from "../../../../../utilities";

const usage =
  "Usage: bun run conclude-action-proposal.ts <daoActionProposalVotingContract> <actionContractToExecute> <daoTokenContract> <proposalId>";
const usageExample =
  "Example: bun run conclude-action-proposal.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.slow7-action-proposal-voting ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.slow7-action-send-message ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.slow7-token 13";

interface ExpectedArgs {
  daoActionProposalVotingContract: string;
  actionContractToExecute: string;
  daoTokenContract: string;
  proposalId: number;
}

function validateArgs(): ExpectedArgs {
  const [
    daoActionProposalVotingContract,
    actionContractToExecute,
    daoTokenContract,
    proposalIdStr,
  ] = process.argv.slice(2);

  if (
    !daoActionProposalVotingContract ||
    !actionContractToExecute ||
    !daoTokenContract ||
    proposalIdStr === undefined
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

  if (!isValidContractPrincipal(actionContractToExecute)) {
    const errorMessage = [
      `Invalid action contract to execute: ${actionContractToExecute}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  if (!isValidContractPrincipal(daoTokenContract)) {
    const errorMessage = [
      `Invalid DAO token contract: ${daoTokenContract}`,
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

  return {
    daoActionProposalVotingContract,
    actionContractToExecute,
    daoTokenContract,
    proposalId,
  };
}

async function main() {
  const args = validateArgs();
  const [extensionAddress, extensionName] =
    args.daoActionProposalVotingContract.split(".");
  const [daoTokenAddress, daoTokenName] = args.daoTokenContract.split(".");

  const networkObj = getNetwork(CONFIG.NETWORK);
  const { address, key } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  const nextPossibleNonce = await getNextNonce(CONFIG.NETWORK, address);

  const proposalBondInfo = await getBondFromActionProposal(
    args.daoActionProposalVotingContract,
    args.proposalId,
    args.daoTokenContract,
    address
  );

  const postConditions = [
    // the bond amount is sent from the proposal voting contract
    Pc.principal(`${extensionAddress}.${extensionName}`)
      .willSendEq(proposalBondInfo.bond.toString())
      .ft(`${daoTokenAddress}.${daoTokenName}`, proposalBondInfo.assetName),
    // TODO: the reward is sent from the rewards account contract
  ];

  const functionArgs = [
    Cl.principal(args.actionContractToExecute),
    Cl.uint(args.proposalId),
  ];

  const txOptions: SignedContractCallOptions = {
    contractAddress: extensionAddress,
    contractName: extensionName,
    functionName: "conclude-action-proposal",
    functionArgs,
    network: networkObj,
    nonce: nextPossibleNonce,
    senderKey: key,
    postConditionMode: PostConditionMode.Allow,
    // postConditionMode: PostConditionMode.Deny,
    // postConditions,
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
