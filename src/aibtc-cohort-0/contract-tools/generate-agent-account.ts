import fs from "node:fs";
import path from "node:path";
import { ContractApiClient } from "../api/client";
import {
  CONFIG,
  convertStringToBoolean,
  createErrorResponse,
  isValidContractPrincipal,
  sendToLLM,
  ToolResponse,
  validateNetwork,
} from "../../utilities";
import { validateStacksAddress } from "@stacks/transactions";

const usage =
  "Usage: bun run generate-agent-account.ts <ownerAddress> <daoTokenContract> <daoTokenDexContract> [agentAddress] [network] [saveToFile]";
const usageExample =
  "Example: bun run generate-agent-account.ts ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.dao-token ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.dao-token-dex ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM \"testnet\" true";

interface ExpectedArgs {
  ownerAddress: string;
  daoTokenContract: string;
  daoTokenDexContract: string;
  agentAddress?: string;
  network?: string;
  saveToFile?: boolean;
  // build replacements from params
  customReplacements?: Record<string, string>;
}

function validateArgs(): ExpectedArgs {
  const [
    ownerAddress,
    daoTokenContract,
    daoTokenDexContract,
    agentAddress,
    network = CONFIG.NETWORK,
    saveToFileStr = "false",
  ] = process.argv.slice(2);

  if (!ownerAddress) {
    const errorMessage = [
      "Owner address is required",
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  if (!validateStacksAddress(ownerAddress)) {
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
  if (agentAddress && !validateStacksAddress(agentAddress)) {
    const errorMessage = [
      `Invalid agent address: ${agentAddress}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  // Parse saveToFile parameter
  const saveToFile = convertStringToBoolean(saveToFileStr);

  return {
    ownerAddress,
    daoTokenContract,
    daoTokenDexContract,
    agentAddress,
    network: validateNetwork(network),
    saveToFile,
    // build replacements from params
    customReplacements: {
      owner_address: ownerAddress,
      agent_address: agentAddress || ownerAddress,
      dao_token_contract: daoTokenContract,
      dao_token_dex_contract: daoTokenDexContract,
    },
  };
}

/**
 * Save generated agent account contract to a file in the contract-tools/generated directory
 */
export async function saveContractToFile(
  contractData: any,
  ownerAddress: string,
  network: string
) {
  // Create the directory if it doesn't exist
  const outputDir = path.join(__dirname, "generated", "agent-accounts", network);
  fs.mkdirSync(outputDir, { recursive: true });

  // Use the contract's name property if available
  const contractName = `${ownerAddress.split(".")[0]}-agent-account`;
  const filePath = path.join(outputDir, `${contractName}.clar`);
  
  if (!contractData.source) {
    throw new Error(
      `Contract ${contractName} does not have source code available`
    );
  }
  
  const sourceCode = contractData.source;
  fs.writeFileSync(filePath, sourceCode);
  
  // Save the full response as JSON for reference
  const jsonPath = path.join(outputDir, `${contractName}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(contractData, null, 2));
  
  return {
    contractPath: filePath,
    jsonPath: jsonPath
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
    const generatedContract = await apiClient.generateContract(
      contractName,
      args.network,
      "aibtc", // Default token symbol
      args.customReplacements
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

    // Save contract to file if requested
    let filePaths = null;
    if (args.saveToFile) {
      filePaths = await saveContractToFile(
        generatedContract.contract,
        args.ownerAddress,
        args.network
      );
    }

    return {
      success: true,
      message: `Successfully generated agent account contract for owner ${args.ownerAddress}${
        args.saveToFile ? " (saved to file)" : ""
      }`,
      data: {
        ...generatedContract,
        filePaths
      },
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
  saveToFile?: boolean;
}

export async function generateAgentAccount(params: AgentAccountParams) {
  const {
    ownerAddress,
    agentAddress = ownerAddress,
    daoTokenContract,
    daoTokenDexContract,
    network = CONFIG.NETWORK,
    saveToFile = false,
  } = params;

  const validNetwork = validateNetwork(network);
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
      validNetwork,
      "aibtc", // Default token symbol
      customReplacements
    );

    // Save contract to file if requested
    let filePaths = null;
    if (saveToFile && generatedContract.contract) {
      filePaths = await saveContractToFile(
        generatedContract.contract,
        ownerAddress,
        validNetwork
      );
    }

    return {
      ...generatedContract,
      filePaths
    };
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
