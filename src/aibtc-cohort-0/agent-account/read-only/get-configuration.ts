import { fetchCallReadOnlyFunction, cvToValue } from "@stacks/transactions";
import {
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  getNetwork,
  isValidContractPrincipal,
  sendToLLM,
  ToolResponse,
} from "../../../utilities";

const usage = "Usage: bun run get-configuration.ts <agentAccountContract>";
const usageExample =
  "Example: bun run get-configuration.ts ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-agent-account-test";

interface ExpectedArgs {
  agentAccountContract: string;
}

interface AgentAccountConfiguration {
  account: string;
  agent: string;
  owner: string;
  daoToken: string;
  daoTokenDex: string;
  sbtcToken: string;
}

function validateArgs(): ExpectedArgs {
  const [agentAccountContract] = process.argv.slice(2);
  if (!agentAccountContract) {
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

  return {
    agentAccountContract,
  };
}

async function main(): Promise<ToolResponse<AgentAccountConfiguration>> {
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
    functionName: "get-configuration",
    functionArgs: [],
    senderAddress: address,
    network: networkObj,
  });

  const configuration = cvToValue(result) as AgentAccountConfiguration;
  return {
    success: true,
    message: "Agent account configuration retrieved successfully",
    data: configuration,
  };
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
