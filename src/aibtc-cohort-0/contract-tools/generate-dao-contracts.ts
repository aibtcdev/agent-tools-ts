import { ContractApiClient } from "../api/client";
import {
  CONFIG,
  createErrorResponse,
  sendToLLM,
  ToolResponse,
} from "../../utilities";

const usage =
  "Usage: bun run generate-dao-contracts.ts <tokenSymbol> [network] [customReplacements] [saveToFile]";
const usageExample =
  'Example: bun run generate-dao-contracts.ts MYTOKEN devnet \'{"token_name":"My Token"}\' true';

interface ExpectedArgs {
  tokenSymbol: string;
  network?: string;
  customReplacements?: Record<string, any>;
  saveToFile?: boolean;
}

function validateArgs(): ExpectedArgs {
  const [tokenSymbol, network = CONFIG.NETWORK, customReplacementsStr, saveToFileStr = "false"] =
    process.argv.slice(2);

  if (!tokenSymbol) {
    const errorMessage = ["Token symbol is required", usage, usageExample].join(
      "\n"
    );
    throw new Error(errorMessage);
  }

  let customReplacements = {};
  if (customReplacementsStr) {
    try {
      customReplacements = JSON.parse(customReplacementsStr);
    } catch (error) {
      const errorMessage = [
        "Invalid JSON format for customReplacements",
        usage,
        usageExample,
      ].join("\n");
      throw new Error(errorMessage);
    }
  }

  // Parse saveToFile parameter
  const saveToFile = saveToFileStr.toLowerCase() === "true";

  return {
    tokenSymbol,
    network,
    customReplacements,
    saveToFile,
  };
}

async function main(): Promise<ToolResponse<any>> {
  const args = validateArgs();
  const apiClient = new ContractApiClient();

  try {
    const result = await apiClient.generateDaoContracts(
      args.network,
      args.tokenSymbol,
      args.customReplacements
    );

    if (!result.success || !result.data) {
      return {
        success: false,
        message: `Failed to generate DAO contracts: ${
          result.message || "Unknown error"
        }`,
        data: null,
      };
    }

    // Check if contracts are in data.contracts or directly in data
    const contracts = result.data.contracts || result.data;
    
    // Save contracts to files if requested
    if (args.saveToFile) {
      await saveContractsToFiles(contracts, args.tokenSymbol, args.network);
    }
    
    // Create a truncated version of the contracts for the response
    const truncatedContracts = {};
    for (const [key, contractData] of Object.entries(contracts)) {
      const contractName = contractData.name || key;
      const sourceCode = contractData.source || contractData.content || contractData.code || "";
      const truncatedSource = sourceCode.length > 150 
        ? sourceCode.substring(0, 147) + "..." 
        : sourceCode;
      
      truncatedContracts[contractName] = {
        ...contractData,
        source: truncatedSource,
        content: undefined,
        code: undefined
      };
    }
    
    return {
      success: true,
      message: `Successfully generated ${
        Array.isArray(contracts) ? contracts.length : Object.keys(contracts).length
      } DAO contracts for token ${args.tokenSymbol} on ${args.network}${
        args.saveToFile ? " (saved to files)" : ""
      }`,
      data: {
        ...result.data,
        contracts: truncatedContracts
      },
    };
  } catch (error) {
    const errorMessage = [
      `Error generating DAO contracts:`,
      `${error instanceof Error ? error.message : String(error)}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
}

// Export for use in other modules
export interface DeployDaoParams {
  tokenSymbol: string;
  tokenName: string;
  tokenMaxSupply: number;
  tokenUri: string;
  logoUrl: string;
  originAddress: string;
  daoManifest: string;
  tweetOrigin: string;
  daoManifestInscriptionId?: string;
  network?: string;
}

export async function generateDaoContracts(
  tokenSymbol: string,
  network: string = "devnet",
  customReplacements: Record<string, any> = {}
) {
  const apiClient = new ContractApiClient();

  try {
    const result = await apiClient.generateDaoContracts(
      network,
      tokenSymbol,
      customReplacements
    );

    if (!result.success || !result.data) {
      throw new Error(`Failed to generate DAO contracts: ${result.message || "Unknown error"}`);
    }

    return result;
  } catch (error) {
    console.error("Error generating DAO contracts:", error);
    throw error;
  }
}

/**
 * Save generated contracts to files in the contract-tools/generated directory
 */
async function saveContractsToFiles(
  contracts: any,
  tokenSymbol: string,
  network: string
) {
  const fs = require("fs");
  const path = require("path");
  
  // Create the directory if it doesn't exist
  const outputDir = path.join(__dirname, "generated", tokenSymbol, network);
  fs.mkdirSync(outputDir, { recursive: true });
  
  // Save each contract to a file
  for (const [key, contractData] of Object.entries(contracts)) {
    // Use the contract's name property if available, otherwise use the key
    const contractName = contractData.name || key;
    const filePath = path.join(outputDir, `${contractName}.clar`);
    const sourceCode = contractData.source || contractData.content || contractData.code || "";
    fs.writeFileSync(filePath, sourceCode);
    console.log(`Saved contract ${contractName} to ${filePath}`);
  }
  
  // Save the full response as JSON for reference
  const jsonPath = path.join(outputDir, `_full_response.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(contracts, null, 2));
  console.log(`Saved full response to ${jsonPath}`);
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
