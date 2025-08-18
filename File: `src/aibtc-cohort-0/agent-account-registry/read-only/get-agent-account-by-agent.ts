import {
  fetchCallReadOnlyFunction,
  Cl,
  cvToValue,
  validateStacksAddress,
} from "@stacks/transactions";
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
  "Usage: bun run get-agent-account-by-agent.ts <registryContract> <agentPrincipal>";
const usageExample =
  "Example: bun run get-agent-account-by-agent.ts ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.agent-account-registry ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";

interface ExpectedArgs {
  registryContract: string;
  agentPrincipal: string;
}

function validateArgs(): ExpectedArgs {
  const [registryContract, agentPrincipal] = process.argv.slice(2);

  if (!registryContract || !agentPrincipal) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  if (!isValidContractPrincipal(registryContract)) {
    const errorMessage = [
      `Invalid registry contract address: ${registryContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  if (!validateStacksAddress(agentPrincipal)) {
    const errorMessage = [
      `Invalid agent principal: ${agentPrincipal}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  return {
    registryContract,
    agentPrincipal,
  };
}

async function main(): Promise<ToolResponse<string | null>> {
  const args = validateArgs();
  const [contractAddress, contractName] = args.registryContract.split(".");

  const networkObj = getNetwork(CONFIG.NETWORK);
  const { address } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );

  const result = await fetchCallReadOnlyFunction({
    contractAddress,
    contractName,
    functionName: "get-agent-account-by-agent",
    functionArgs: [Cl.principal(args.agentPrincipal)],
    senderAddress: address,
    network: networkObj,
  });

  const agentAccount = cvToValue(result, true) as string | null;

  return {
    success: true,
    message: "Agent account by agent retrieved successfully",
    data: agentAccount,
  };
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
