import {
  Cl,
  makeContractCall,
  SignedContractCallOptions,
  PostConditionMode,
} from "@stacks/transactions";
import { getAgentAccountApprovalType } from "@aibtc/types";
import {
  broadcastTx,
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  getNetwork,
  getNextNonce,
  isValidContractPrincipal,
  sendToLLM,
} from "../../../utilities";

const usage =
  "Usage: bun run revoke-contract.ts <agentAccountContract> <contractToRevoke> <type>";
const usageExample =
  "Example: bun run revoke-contract.ts ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-agent-account-test ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.slow7-action-proposal-voting VOTING";

interface ExpectedArgs {
  agentAccountContract: string;
  contractToRevoke: string;
  revocationType: number;
}

function validateArgs(): ExpectedArgs {
  const [agentAccountContract, contractToRevoke, revocationTypeInput] =
    process.argv.slice(2);

  if (!agentAccountContract || !contractToRevoke || !revocationTypeInput) {
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
  if (!isValidContractPrincipal(contractToRevoke)) {
    const errorMessage = [
      `Invalid contract to revoke address: ${contractToRevoke}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  let numericType: number;
  try {
    numericType = getAgentAccountApprovalType(revocationTypeInput);
  } catch (error: any) {
    const errorMessage = [error.message, usage, usageExample].join("\n");
    throw new Error(errorMessage);
  }

  return {
    agentAccountContract,
    contractToRevoke,
    revocationType: numericType,
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
    Cl.principal(args.contractToRevoke),
    Cl.uint(args.revocationType),
  ];

  const txOptions: SignedContractCallOptions = {
    contractAddress,
    contractName,
    functionName: "revoke-contract",
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
