import {
  Cl,
  makeContractCall,
  SignedContractCallOptions,
  PostConditionMode,
} from "@stacks/transactions";
import {
  AGENT_ACCOUNT_APPROVAL_TYPES,
  AgentAccountApprovalType,
} from "../../../aibtc-dao/types/dao-types";
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
  "Usage: bun run approve-contract.ts <agentAccountContract> <contractToApprove> <type>";
const usageExample =
  "Example: bun run approve-contract.ts ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-agent-account-test ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.slow7-action-proposal-voting VOTING";

interface ExpectedArgs {
  agentAccountContract: string;
  contractToApprove: string;
  approvalType: number;
}

function validateArgs(): ExpectedArgs {
  const [agentAccountContract, contractToApprove, approvalTypeInput] =
    process.argv.slice(2);

  if (!agentAccountContract || !contractToApprove || !approvalTypeInput) {
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
  if (!isValidContractPrincipal(contractToApprove)) {
    const errorMessage = [
      `Invalid contract to approve address: ${contractToApprove}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  let numericType: number | undefined;
  const approvalTypeNumber = parseInt(approvalTypeInput, 10);
  const validValues = Object.values(AGENT_ACCOUNT_APPROVAL_TYPES);

  if (!isNaN(approvalTypeNumber)) {
    if (validValues.includes(approvalTypeNumber as any)) {
      numericType = approvalTypeNumber;
    }
  } else {
    const upperApprovalType =
      approvalTypeInput.toUpperCase() as AgentAccountApprovalType;
    if (upperApprovalType in AGENT_ACCOUNT_APPROVAL_TYPES) {
      numericType = AGENT_ACCOUNT_APPROVAL_TYPES[upperApprovalType];
    }
  }

  if (numericType === undefined) {
    const validOptions = [
      ...Object.keys(AGENT_ACCOUNT_APPROVAL_TYPES),
      ...validValues,
    ].join(", ");
    const errorMessage = [
      `Invalid approval type: ${approvalTypeInput}. Must be one of ${validOptions}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  return {
    agentAccountContract,
    contractToApprove,
    approvalType: numericType,
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
    Cl.principal(args.contractToApprove),
    Cl.uint(args.approvalType),
  ];

  const txOptions: SignedContractCallOptions = {
    contractAddress,
    contractName,
    functionName: "approve-contract",
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
