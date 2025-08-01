import { fetchCallReadOnlyFunction, Cl, cvToValue } from "@stacks/transactions";
import { getAgentAccountApprovalType } from "@aibtc/types";
import {
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  getNetwork,
  isValidContractPrincipal,
  sendToLLM,
  ToolResponse,
} from "../../../utilities";

const usage =
  "Usage: bun run is-approved-contract.ts <agentAccountContract> <contractPrincipal> <type>";
const usageExample =
  "Example: bun run is-approved-contract.ts ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-agent-account-test ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-token TOKEN";

interface ExpectedArgs {
  agentAccountContract: string;
  contractPrincipal: string;
  approvalType: number;
}

function validateArgs(): ExpectedArgs {
  const [agentAccountContract, contractPrincipal, approvalTypeInput] =
    process.argv.slice(2);

  if (!agentAccountContract || !contractPrincipal || !approvalTypeInput) {
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
  if (!isValidContractPrincipal(contractPrincipal)) {
    const errorMessage = [
      `Invalid contract principal: ${contractPrincipal}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  let numericType: number;
  try {
    numericType = getAgentAccountApprovalType(approvalTypeInput);
  } catch (error: any) {
    const errorMessage = [error.message, usage, usageExample].join("\n");
    throw new Error(errorMessage);
  }

  return {
    agentAccountContract,
    contractPrincipal,
    approvalType: numericType,
  };
}

async function main(): Promise<ToolResponse<boolean>> {
  const args = validateArgs();
  const [contractAddress, contractName] = args.agentAccountContract.split(".");

  const networkObj = getNetwork(CONFIG.NETWORK);
  const { address } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );

  const result = await fetchCallReadOnlyFunction({
    contractAddress,
    contractName,
    functionName: "is-approved-contract",
    functionArgs: [
      Cl.principal(args.contractPrincipal),
      Cl.uint(args.approvalType),
    ],
    senderAddress: address,
    network: networkObj,
  });

  const isApproved = cvToValue(result, true) as boolean;
  return {
    success: true,
    message: "Contract approval status retrieved successfully",
    data: isApproved,
  };
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
