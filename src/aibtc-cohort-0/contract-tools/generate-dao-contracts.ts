import { ContractApiClient } from "../api/client";
import {
  CONFIG,
  createErrorResponse,
  sendToLLM,
  ToolResponse,
} from "../../../utilities";

const usage = "Usage: bun run generate-dao-contracts.ts <tokenSymbol> [network] [customReplacements]";
const usageExample = "Example: bun run generate-dao-contracts.ts MYTOKEN devnet '{\"token_name\":\"My Token\"}'";

interface ExpectedArgs {
  tokenSymbol: string;
  network?: string;
  customReplacements?: Record<string, any>;
}

function validateArgs(): ExpectedArgs {
  const [tokenSymbol, network = CONFIG.NETWORK, customReplacementsStr] = process.argv.slice(2);
  
  if (!tokenSymbol) {
    const errorMessage = [
      "Token symbol is required",
      usage,
      usageExample,
    ].join("\n");
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

  return {
    tokenSymbol,
    network,
    customReplacements,
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

    if (!result.success || !result.contracts) {
      return {
        success: false,
        message: `Failed to generate DAO contracts: ${result.message || "Unknown error"}`,
        data: null,
      };
    }

    return {
      success: true,
      message: `Successfully generated ${Object.keys(result.contracts).length} DAO contracts for token ${args.tokenSymbol} on ${args.network}`,
      data: result,
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

    if (!result.contracts) {
      throw new Error(`Failed to generate DAO contracts`);
    }

    return result;
  } catch (error) {
    console.error("Error generating DAO contracts:", error);
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
