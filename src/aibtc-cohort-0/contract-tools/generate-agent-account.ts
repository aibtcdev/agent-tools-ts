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
import { ContractResponse, GeneratedContractResponse } from "@aibtc/types";

const usage =
  "Usage: bun run generate-agent-account.ts <ownerAddress> <agentAddress> <daoTokenContract> <daoTokenDexContract> [network] [saveToFile]";
const usageExample =
  "Example: bun run generate-agent-account.ts ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5 ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-faktory ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-faktory-dex testnet true";

interface ExpectedArgs {
  ownerAddress: string;
  agentAddress: string;
  daoTokenContract: string;
  daoTokenDexContract: string;
  network?: string;
  saveToFile?: boolean;
}

function validateArgs(): ExpectedArgs {
  const [
    ownerAddress,
    agentAddress,
    daoTokenContract,
    daoTokenDexContract,
    network = CONFIG.NETWORK,
    saveToFileStr = "false",
  ] = process.argv.slice(2);

  if (!validateStacksAddress(ownerAddress)) {
    const errorMessage = [
      `Invalid owner address: ${ownerAddress}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  if (!validateStacksAddress(agentAddress)) {
    const errorMessage = [
      `Invalid agent address: ${agentAddress}`,
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

  if (!isValidContractPrincipal(daoTokenDexContract)) {
    const errorMessage = [
      `Invalid DAO token DEX contract: ${daoTokenDexContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  // Parse saveToFile parameter
  const saveToFile = convertStringToBoolean(saveToFileStr);

  return {
    ownerAddress,
    agentAddress,
    daoTokenContract,
    daoTokenDexContract,
    network: validateNetwork(network),
    saveToFile,
  };
}

/**
 * Save generated agent account contract to a file in the contract-tools/generated directory
 */
export async function saveContractToFile(
  contract: ContractResponse,
  network: string
) {
  // Create the directory if it doesn't exist
  const outputDir = path.join(
    __dirname,
    "generated",
    "agent-accounts",
    network
  );
  fs.mkdirSync(outputDir, { recursive: true });

  // Use the contract's name property
  const contractName = contract.displayName ?? contract.name;
  const filePath = path.join(outputDir, `${contractName}.clar`);

  if (!contract.source) {
    throw new Error(
      `Contract ${contractName} does not have source code available`
    );
  }

  const sourceCode = contract.source;
  fs.writeFileSync(filePath, sourceCode);

  // Save the full response as JSON for reference
  const jsonPath = path.join(outputDir, `${contractName}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(contract, null, 2));

  return {
    contractPath: filePath,
    jsonPath: jsonPath,
  };
}

async function main(): Promise<ToolResponse<GeneratedContractResponse>> {
  const args = validateArgs();
  const apiClient = new ContractApiClient();

  try {
    // Generate contract name in the format aibtc-acct-ABCDE-FGHIJ-KLMNO-PQRST
    const ownerFirst5 = args.ownerAddress.substring(0, 5);
    const ownerLast5 = args.ownerAddress.substring(
      args.ownerAddress.length - 5
    );
    const agentAddress = args.agentAddress || args.ownerAddress;
    const agentFirst5 = agentAddress.substring(0, 5);
    const agentLast5 = agentAddress.substring(agentAddress.length - 5);
    const contractName = `aibtc-acct-${ownerFirst5}-${ownerLast5}-${agentFirst5}-${agentLast5}`;

    // Generate the agent account contract using the new endpoint
    const result = await apiClient.generateAgentAccount(
      contractName,
      args.network,
      {
        account_owner: args.ownerAddress,
        account_agent: args.agentAddress || args.ownerAddress,
        dao_token: args.daoTokenContract,
        dao_token_dex: args.daoTokenDexContract,
        contractName: contractName,
      }
    );

    console.log("Result:", result);

    if (!result.success || !result.data?.contract) {
      if (result.error) {
        throw new Error(result.error.message);
      }
      throw new Error(
        `Failed to generate agent account: ${JSON.stringify(result)}`
      );
    }

    const contract = result.data.contract;
    contract.displayName = contractName;

    // Save contract to file if requested
    let filePaths = null;
    if (args.saveToFile) {
      filePaths = await saveContractToFile(
        contract,
        args.network ?? CONFIG.NETWORK
      );
    }

    // Truncate source code for response
    const truncatedSource =
      contract.source && contract.source.length > 100
        ? contract.source.substring(0, 97) + "..."
        : contract.source;

    const truncatedContract = {
      ...contract,
      source: truncatedSource,
    };

    return {
      success: true,
      message: `Successfully generated agent account contract for owner ${
        args.ownerAddress
      }${args.saveToFile ? " (saved to file)" : ""}`,
      data: {
        tokenSymbol: "aibtc", // TODO: find cleaner way
        network: args.network ?? CONFIG.NETWORK,
        ...contract,
        contract: truncatedContract,
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
    // Generate contract name in the format aibtc-acct-ABCDE-FGHIJ-KLMNO-PQRST
    const ownerFirst5 = ownerAddress.substring(0, 5);
    const ownerLast5 = ownerAddress.substring(ownerAddress.length - 5);
    const agentFirst5 = agentAddress.substring(0, 5);
    const agentLast5 = agentAddress.substring(agentAddress.length - 5);
    const contractName = `aibtc-acct-${ownerFirst5}-${ownerLast5}-${agentFirst5}-${agentLast5}`;

    // Generate the agent account contract using the new endpoint
    const result = await apiClient.generateAgentAccount(
      contractName,
      validNetwork,
      {
        account_owner: ownerAddress,
        account_agent: agentAddress,
        dao_token: daoTokenContract,
        dao_token_dex: daoTokenDexContract,
        contractName: contractName,
      }
    );

    if (!result.success || !result.data?.contract) {
      if (result.error) {
        throw new Error(result.error.message);
      }
      throw new Error(
        `Failed to generate agent account: ${JSON.stringify(result)}`
      );
    }

    const contract = result.data.contract;

    // Save contract to file if requested
    let filePaths = null;
    if (saveToFile) {
      filePaths = await saveContractToFile(contract, validNetwork);
    }

    return {
      success: true,
      message: `Successfully generated agent account contract for owner ${ownerAddress}`,
      contract,
      filePaths,
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
