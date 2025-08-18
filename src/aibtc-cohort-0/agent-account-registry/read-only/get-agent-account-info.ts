import { fetchCallReadOnlyFunction, Cl, cvToValue } from "@stacks/transactions";
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
  "Usage: bun run get-agent-account-info.ts <registryContract> <agentAccountContract>";
const usageExample =
  "Example: bun run get-agent-account-info.ts ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.agent-account-registry ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-agent-account-test";

interface ExpectedArgs {
  registryContract: string;
  agentAccountContract: string;
}

interface AgentAccountInfo {
  owner: string;
  agent: string;
  "attestation-level": bigint;
}

function validateArgs(): ExpectedArgs {
  const [registryContract, agentAccountContract] = process.argv.slice(2);

  if (!registryContract || !agentAccountContract) {
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
  if (!isValidContractPrincipal(agentAccountContract)) {
    const errorMessage = [
      `Invalid agent account contract address: ${agentAccountContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  return {
    registryContract,
    agentAccountContract,
  };
}

async function main(): Promise<ToolResponse<AgentAccountInfo | null>> {
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
    functionName: "get-agent-account-info",
    functionArgs: [Cl.principal(args.agentAccountContract)],
    senderAddress: address,
    network: networkObj,
  });

  const accountInfo = cvToValue(result, true) as AgentAccountInfo | null;

  return {
    success: true,
    message: "Agent account info retrieved successfully",
    data: accountInfo,
  };
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
