import {
  Cl,
  makeContractCall,
  SignedContractCallOptions,
  PostConditionMode,
  makeUnsignedContractCall,
  privateKeyToPublic,
  UnsignedContractCallOptions,
} from "@stacks/transactions";
import {
  broadcastTx,
  broadcastSponsoredTx,
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  getNetwork,
  getNextNonce,
  isValidContractPrincipal,
  sendToLLM,
} from "../../../utilities";

const usage =
  "Usage: bun run veto-action-proposal.ts <agentAccountContract> <votingContract> <proposalId>";
const usageExample =
  "Example: bun run veto-action-proposal.ts ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-agent-account-test ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-action-proposals-v2 1";

interface ExpectedArgs {
  agentAccountContract: string;
  votingContract: string;
  proposalId: number;
}

function validateArgs(): ExpectedArgs {
  const [agentAccountContract, votingContract, proposalIdStr] =
    process.argv.slice(2);
  const proposalId = parseInt(proposalIdStr);

  if (
    !agentAccountContract ||
    !votingContract ||
    !proposalIdStr ||
    isNaN(proposalId)
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

  return {
    agentAccountContract,
    votingContract,
    proposalId,
  };
}

async function main() {
  const args = validateArgs();
  const [contractAddress, contractName] = args.agentAccountContract.split(".");

  const networkObj = getNetwork(CONFIG.NETWORK);
  const { address, key } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  const pubKey = privateKeyToPublic(key);

  /**
   * Uncomment to send directly by signing / paying for the transaction
   * requires makeContractCall() and broadcastTx()
  const nextPossibleNonce = await getNextNonce(CONFIG.NETWORK, address);
  */

  const functionArgs = [
    Cl.principal(args.votingContract),
    Cl.uint(args.proposalId),
  ];

  /**
   * Uncomment to send directly by signing / paying for the transaction
   * requires makeContractCall() and broadcastTx()
  const txOptions: SignedContractCallOptions = {
    contractAddress,
    contractName,
    functionName: "veto-action-proposal",
    functionArgs,
    network: networkObj,
    nonce: nextPossibleNonce,
    senderKey: key,
    postConditionMode: PostConditionMode.Deny, // Or .Allow if no specific conditions
    postConditions: [], // Typically no direct asset transfers for veto
  };
  */

  const unsignedTxOptions: UnsignedContractCallOptions = {
    contractAddress,
    contractName,
    functionName: "veto-action-proposal",
    functionArgs,
    network: networkObj,
    publicKey: pubKey,
    sponsored: true,
    postConditionMode: PostConditionMode.Deny, // Or .Allow if no specific conditions
    postConditions: [], // Typically no direct asset transfers for veto
  };

  try {
    const unsignedTx = await makeUnsignedContractCall(unsignedTxOptions);
    const broadcastResponse = await broadcastSponsoredTx(
      unsignedTx,
      networkObj
    );
    // const transaction = await makeContractCall(txOptions);
    // const broadcastResponse = await broadcastTx(transaction, networkObj);
    return broadcastResponse;
  } catch (error) {
    const errorMessage = [
      `Error vetoing action proposal via agent account:`,
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
