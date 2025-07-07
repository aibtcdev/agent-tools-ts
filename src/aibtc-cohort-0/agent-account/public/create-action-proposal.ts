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
  getCurrentActionProposalBond,
  getNetwork,
  getNextNonce,
  isValidContractPrincipal,
  sendToLLM,
} from "../../../utilities";
import { formatSerializedBuffer } from "@aibtc/types";

const usage =
  "Usage: bun run create-action-proposal.ts <agentAccountContract> <daoActionProposalVotingContract> <actionContractToExecute> <daoTokenContract> <messageToSend> [memo]";
const usageExample =
  'Example: bun run create-action-proposal.ts ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-acct-ST1PQ-PGZGM-ST35K-VM3QA ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.slow7-action-proposal-voting ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.slow7-action-send-message ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.slow7-token "This is my message." "This is my memo."';

interface ExpectedArgs {
  agentAccountContract: string;
  daoActionProposalVotingContract: string;
  actionContractToExecute: string;
  daoTokenContract: string;
  messageToSend: string; // can replace with hex params in future
  memo?: string;
}

function validateArgs(): ExpectedArgs {
  const [
    agentAccountContract,
    daoActionProposalVotingContract,
    actionContractToExecute,
    daoTokenContract,
    messageToSend,
    memo,
  ] = process.argv.slice(2);

  if (
    !agentAccountContract ||
    !daoActionProposalVotingContract ||
    !actionContractToExecute ||
    !daoTokenContract ||
    !messageToSend
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
      `Invalid voting contract address: ${daoActionProposalVotingContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  if (!isValidContractPrincipal(actionContractToExecute)) {
    const errorMessage = [
      `Invalid action contract address: ${actionContractToExecute}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  if (!isValidContractPrincipal(daoTokenContract)) {
    const errorMessage = [
      `Invalid DAO token contract address: ${daoTokenContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  return {
    agentAccountContract,
    daoActionProposalVotingContract,
    actionContractToExecute,
    messageToSend,
    daoTokenContract,
    memo: memo || undefined,
  };
}

async function main() {
  const args = validateArgs();
  const [agentAccountAddress, agentAccountName] =
    args.agentAccountContract.split(".");
  const [daoTokenAddress, daoTokenName] = args.daoTokenContract.split(".");

  const networkObj = getNetwork(CONFIG.NETWORK);
  const { address, key } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  const nextPossibleNonce = await getNextNonce(CONFIG.NETWORK, address);

  // Get bond amount for post-condition
  const bondAmountInfo = await getCurrentActionProposalBond(
    args.daoActionProposalVotingContract,
    args.daoTokenContract,
    address // sender for read-only call
  );

  const postConditions = [
    // the bond amount is sent from the agent account
    Pc.principal(args.agentAccountContract)
      .willSendEq(bondAmountInfo.bond.toString())
      .ft(`${daoTokenAddress}.${daoTokenName}`, bondAmountInfo.assetName),
    // TODO: the reward is sent from the treasury to the rewards account contract
    // TODO: the run cost is sent from the treasury to the run cost contract
  ];

  const stringCV = Cl.stringUtf8(args.messageToSend);
  const functionArgs = [
    Cl.principal(args.daoActionProposalVotingContract),
    Cl.principal(args.actionContractToExecute),
    formatSerializedBuffer(stringCV),
    args.memo ? Cl.some(Cl.stringAscii(args.memo)) : Cl.none(),
  ];

  const txOptions: SignedContractCallOptions = {
    contractAddress: agentAccountAddress,
    contractName: agentAccountName,
    functionName: "create-action-proposal",
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
