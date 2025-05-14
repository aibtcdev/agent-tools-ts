import { ContractApiClient } from "../api/client";
import {
  CONFIG,
  createErrorResponse,
  isValidContractPrincipal,
  sendToLLM,
  ToolResponse,
  TxBroadcastResultWithLink,
} from "../../utilities";
import { deployContract } from "../utils/deploy-contract";

const usage =
  "Usage: bun run deploy-agent-account.ts <ownerAddress> <daoTokenContract> <daoTokenDexContract> [agentAddress] [network]";
const usageExample =
  "Example: bun run deploy-agent-account.ts ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.dao-token ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.dao-token-dex";

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

async function main(): Promise<ToolResponse<TxBroadcastResultWithLink>> {
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

    const generatedContract = await apiClient.generateContractForNetwork(
      contractName,
      args.network,
      "aibtc", // Default token symbol
      customReplacements
    );

    if (!generatedContract.success || !generatedContract.contract) {
      return {
        success: false,
        message: `Failed to generate agent account: ${
          generatedContract.message || "Unknown error"
        }`,
        data: null,
      };
    }

    // Prepare for deployment

    // Deploy the contract
    const deployResult = await deployContract({
      contractName: `${args.ownerAddress.split(".")[0]}-agent-account`,
      sourceCode: generatedContract.contract.source,
      clarityVersion: generatedContract.contract.clarityVersion,
    });

    return {
      success: true,
      message: `Successfully deployed agent account contract for owner ${args.ownerAddress}`,
      data: deployResult,
    };
  } catch (error) {
    const errorMessage = [
      `Error deploying agent account:`,
      `${error instanceof Error ? error.message : String(error)}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
}

// Export for use in other modules
export interface DeployAgentAccountParams {
  ownerAddress: string;
  agentAddress?: string;
  daoTokenContract: string;
  daoTokenDexContract: string;
  network?: string;
}

export async function deployAgentAccount(params: DeployAgentAccountParams) {
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

    const generatedContract = await apiClient.generateContractForNetwork(
      contractName,
      network,
      "aibtc", // Default token symbol
      customReplacements
    );

    if (!generatedContract.contract) {
      throw new Error("Failed to generate agent account contract");
    }

    // Deploy the contract
    const deployResult = await deployContract({
      contractName: `${ownerAddress.split(".")[0]}-agent-account`,
      sourceCode: generatedContract.contract.source,
      clarityVersion: generatedContract.contract.clarityVersion,
    });

    return deployResult;
  } catch (error) {
    console.error("Error deploying agent account:", error);
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
