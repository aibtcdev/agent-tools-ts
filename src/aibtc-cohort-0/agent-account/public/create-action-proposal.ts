import {
  AnchorMode,
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
  getCurrentBondProposalAmount, // Assuming this utility can be used/adapted
  getNetwork,
  getNextNonce,
  isValidContractPrincipal,
  sendToLLM,
} from "../../../../utilities";

const usage =
  "Usage: bun run create-action-proposal.ts <agentAccountContract> <votingContract> <daoTokenContract> <actionContract> <parametersHex> [memo]";
const usageExample =
  'Example: bun run create-action-proposal.ts ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-agent-account-test ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-action-proposals-v2 ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-token ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-action-send-message 68656c6c6f20776f726c64 "My proposal"';

interface ExpectedArgs {
  agentAccountContract: string;
  votingContract: string;
  daoTokenContract: string;
  actionContract: string;
  parametersHex: string;
  memo?: string;
}

function validateArgs(): ExpectedArgs {
  const [
    agentAccountContract,
    votingContract,
    daoTokenContract,
    actionContract,
    parametersHex,
    memo,
  ] = process.argv.slice(2);

  if (
    !agentAccountContract ||
    !votingContract ||
    !daoTokenContract ||
    !actionContract ||
    !parametersHex
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
  if (!isValidContractPrincipal(votingContract)) {
    const errorMessage = [
      `Invalid voting contract address: ${votingContract}`,
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
  if (!isValidContractPrincipal(actionContract)) {
    const errorMessage = [
      `Invalid action contract address: ${actionContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // Basic hex validation for parameters
  if (!/^[0-9a-fA-F]*$/.test(parametersHex)) {
    const errorMessage = [
      `Invalid parametersHex: ${parametersHex}. Must be a valid hex string.`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  return {
    agentAccountContract,
    votingContract,
    daoTokenContract,
    actionContract,
    parametersHex,
    memo,
  };
}

async function main() {
  const args = validateArgs();
  const [contractAddress, contractName] = args.agentAccountContract.split(".");
  const [daoTokenAddress, daoTokenName] = args.daoTokenContract.split(".");

  const networkObj = getNetwork(CONFIG.NETWORK);
  const { address, key } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  const nextPossibleNonce = await getNextNonce(CONFIG.NETWORK, address);

  // Get bond amount for post-condition
  // The agent account is the sender of the bond.
  const bondAmountInfo = await getCurrentBondProposalAmount(
    args.votingContract, // proposalsExtensionContract in utility
    args.daoTokenContract,
    args.agentAccountContract // sender for context
  );

  const postConditions = [
    Pc.principal(args.agentAccountContract) // The agent account sends the bond
      .willSendEq(bondAmountInfo.bond.toString())
      .ft(`${daoTokenAddress}.${daoTokenName}`, bondAmountInfo.assetName),
  ];

  const functionArgs = [
    Cl.principal(args.votingContract),
    Cl.principal(args.actionContract),
    Cl.bufferFromHex(args.parametersHex),
    args.memo ? Cl.some(Cl.stringAscii(args.memo)) : Cl.none(),
  ];

  const txOptions: SignedContractCallOptions = {
    contractAddress,
    contractName,
    functionName: "create-action-proposal",
    functionArgs,
    network: networkObj,
    nonce: nextPossibleNonce,
    senderKey: key,
    postConditionMode: PostConditionMode.Deny,
    postConditions,
    anchorMode: AnchorMode.Any,
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
