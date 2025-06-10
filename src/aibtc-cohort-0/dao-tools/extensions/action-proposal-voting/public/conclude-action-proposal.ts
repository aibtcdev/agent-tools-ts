import {
  Cl,
  makeContractCall,
  Pc,
  PostConditionMode,
  SignedContractCallOptions,
} from "@stacks/transactions";
import {
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  getNetwork,
  getNextNonce,
  sendToLLM,
  isValidContractPrincipal,
  getCurrentActionProposalBond,
  broadcastSponsoredTx,
} from "../../../../../utilities";

const usage =
  "Usage: bun run conclude-action-proposal.ts <daoActionProposalVotingContract> <proposalId> <actionContractToExecute> <daoTokenContract>";
const usageExample =
  "Example: bun run conclude-action-proposal.ts ST000000000000000000002AMW42H.aibtc-action-proposal-voting 1 ST000000000000000000002AMW42H.some-action-contract ST000000000000000000002AMW42H.aibtc-token";

interface ExpectedArgs {
  daoActionProposalVotingContract: string;
  proposalId: number;
  actionContractToExecute: string;
  daoTokenContract: string;
}

function validateArgs(): ExpectedArgs {
  const [
    daoActionProposalVotingContract,
    proposalIdStr,
    actionContractToExecute,
    daoTokenContract,
  ] = process.argv.slice(2);

  if (
    !daoActionProposalVotingContract ||
    proposalIdStr === undefined ||
    !actionContractToExecute ||
    !daoTokenContract
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

  return {
    daoActionProposalVotingContract,
    proposalId,
    actionContractToExecute,
    daoTokenContract,
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

  const proposalBondInfo = await getCurrentActionProposalBond(
    args.daoActionProposalVotingContract,
    args.daoTokenContract,
    address
  );

  const postConditions = [
    Pc.principal(`${extensionAddress}.${extensionName}`)
      .willSendEq(proposalBondInfo.bond.valueOf())
      .ft(`${daoTokenAddress}.${daoTokenName}`, proposalBondInfo.assetName),
  ];

  const functionArgs = [
    Cl.uint(args.proposalId),
    Cl.principal(args.actionContractToExecute),
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
    postConditions: postConditions,
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
      `Error concluding action proposal:`,
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
