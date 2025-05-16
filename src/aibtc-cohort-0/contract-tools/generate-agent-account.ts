import { ContractApiClient } from "../api/client";
import {
  CONFIG,
  createErrorResponse,
  isValidContractPrincipal,
  sendToLLM,
  ToolResponse,
} from "../../utilities";

const usage =
  "Usage: bun run generate-agent-account.ts <ownerAddress> <daoTokenContract> <daoTokenDexContract> [agentAddress] [network]";
const usageExample =
  "Example: bun run generate-agent-account.ts ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.dao-token ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.dao-token-dex";

interface ExpectedArgs {
  ownerAddress: string;
  daoTokenContract: string;
  daoTokenDexContract: string;
  agentAddress?: string;
  network?: string;
}

function validateArgs(): ExpectedArgs {
  const [
    ownerAddress,
    daoTokenContract,
    daoTokenDexContract,
    agentAddress,
    network = CONFIG.NETWORK,
  ] = process.argv.slice(2);

  if (!ownerAddress) {
    const errorMessage = [
      "Owner address is required",
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  if (!isValidContractPrincipal(ownerAddress)) {
    const errorMessage = [
      `Invalid owner address: ${ownerAddress}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  if (!daoTokenContract) {
    const errorMessage = [
      "DAO token contract is required",
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

  if (!daoTokenDexContract) {
    const errorMessage = [
      "DAO token DEX contract is required",
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  if (!isValidContractPrincipal(daoTokenDexContract)) {
    const errorMessage = [
      `Invalid DAO token DEX contract: ${daoTokenDexContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  // If agent address is provided, validate it
  if (agentAddress && !isValidContractPrincipal(agentAddress)) {
    const errorMessage = [
      `Invalid agent address: ${agentAddress}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  return {
    ownerAddress,
    daoTokenContract,
    daoTokenDexContract,
    agentAddress,
    network,
  };
}

async function main(): Promise<ToolResponse<any>> {
  const args = validateArgs();
  const apiClient = new ContractApiClient();

  try {
    // First get the agent account contract template
    const contractResponse = await apiClient.getContractByTypeAndSubtype(
      "SMART_WALLET",
      "BASE"
    );

    if (!contractResponse.success || !contractResponse.contract) {
      return {
        success: false,
        message: "Failed to retrieve agent account contract template",
        data: null,
      };
    }

    const contractName = contractResponse.contract.name;

    // Generate the contract with replacements
    const customReplacements = {
      owner_address: args.ownerAddress,
      agent_address: args.agentAddress || args.ownerAddress,
      dao_token_contract: args.daoTokenContract,
      dao_token_dex_contract: args.daoTokenDexContract,
    };

    const generatedContract = await apiClient.generateContract(
      contractName,
      args.network,
      "aibtc", // Default token symbol
      customReplacements
    );

    if (!generatedContract.success) {
      return {
        success: false,
        message: `Failed to generate agent account: ${
          generatedContract.message || "Unknown error"
        }`,
        data: null,
      };
    }

    return {
      success: true,
      message: `Successfully generated agent account contract for owner ${args.ownerAddress}`,
      data: generatedContract,
    };
  } catch (error) {
    const errorMessage = [
      `Error generating agent account:`,
      `${error instanceof Error ? error.message : String(error)}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
}

// Export for use in other modules
export interface AgentAccountParams {
  ownerAddress: string;
  agentAddress?: string;
  daoTokenContract: string;
  daoTokenDexContract: string;
  network?: string;
}

export async function generateAgentAccount(params: AgentAccountParams) {
  const {
    ownerAddress,
    agentAddress = ownerAddress,
    daoTokenContract,
    daoTokenDexContract,
    network = CONFIG.NETWORK,
  } = params;

  const apiClient = new ContractApiClient();

  try {
    // First get the agent account contract template
    const contractResponse = await apiClient.getContractByTypeAndSubtype(
      "SMART_WALLET",
      "BASE"
    );

    if (!contractResponse.contract) {
      throw new Error("Failed to retrieve agent account contract template");
    }

    const contractName = contractResponse.contract.name;

    // Generate the contract with replacements
    const customReplacements = {
      owner_address: ownerAddress,
      agent_address: agentAddress,
      dao_token_contract: daoTokenContract,
      dao_token_dex_contract: daoTokenDexContract,
    };

    const generatedContract = await apiClient.generateContract(
      contractName,
      network,
      "aibtc", // Default token symbol
      customReplacements
    );

    return generatedContract;
  } catch (error) {
    console.error("Error generating agent account:", error);
    throw error;
  }
}

// Run the main function if this file is executed directly
if (require.main === module) {
  main()
    .then(sendToLLM)
    .catch((error) => {
      sendToLLM(createErrorResponse(error));
      process.exit(1);
    });
}
