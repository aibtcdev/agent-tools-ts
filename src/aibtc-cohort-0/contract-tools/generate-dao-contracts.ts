import { ContractApiClient } from "../api/client";
import {
  CONFIG,
  convertStringToBoolean,
  createErrorResponse,
  sendToLLM,
  ToolResponse,
} from "../../utilities";
import { validateStacksAddress } from "@stacks/transactions";
import { GeneratedDaoContractsResponse, ContractResponse } from "@aibtc/types";
import {
  getContractDisplayName,
  saveDaoContractsToFiles,
} from "../utils/save-contract";

const usage =
  "Usage: bun run generate-dao-contracts.ts <tokenSymbol> <tokenUri> <originAddress> <daoManifest> [tweetOrigin] [network] [saveToFile]";
const usageExample =
  'Example: bun run generate-dao-contracts.ts MYTOKEN "https://example.com/token.json" ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM "This is my DAO" "1894855072556912681" "testnet" true';

interface ExpectedArgs {
  tokenSymbol: string;
  tokenUri: string;
  originAddress: string;
  daoManifest: string;
  tweetOrigin?: string;
  network?: string;
  saveToFile?: boolean;
  // buld replacements from params
  customReplacements?: Record<string, string>;
}

function validateArgs(): ExpectedArgs {
  const [
    tokenSymbol,
    tokenUri,
    originAddress,
    daoManifest,
    tweetOrigin = "",
    network = CONFIG.NETWORK,
    saveToFileStr = "false",
  ] = process.argv.slice(2);

  if (!tokenSymbol) {
    const errorMessage = ["Token symbol is required", usage, usageExample].join(
      "\n"
    );
    throw new Error(errorMessage);
  }

  if (!tokenUri) {
    const errorMessage = ["Token URI is required", usage, usageExample].join(
      "\n"
    );
    throw new Error(errorMessage);
  }

  if (!originAddress || !validateStacksAddress(originAddress)) {
    const errorMessage = [
      "Origin address is required and must be a valid Stacks address",
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  if (!daoManifest) {
    const errorMessage = [
      "DAO manifest / mission is required",
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  // Parse saveToFile parameter
  const saveToFile = convertStringToBoolean(saveToFileStr);

  return {
    tokenSymbol,
    tokenUri,
    originAddress,
    daoManifest,
    tweetOrigin: tweetOrigin || undefined,
    network: network || CONFIG.NETWORK,
    saveToFile,
    // buld replacements from params
    customReplacements: {
      dao_manifest: daoManifest,
      tweet_origin: tweetOrigin || "",
      origin_address: originAddress,
      dao_token_metadata: tokenUri,
      dao_token_symbol: tokenSymbol,
    },
  };
}

async function main(): Promise<ToolResponse<GeneratedDaoContractsResponse>> {
  const args = validateArgs();
  const apiClient = new ContractApiClient();

  try {
    const result = await apiClient.generateDaoContracts(
      args.network,
      args.tokenSymbol,
      args.customReplacements
    );

    if (!result.success || !result.data) {
      if (result.error) {
        throw new Error(result.error.message);
      }
      throw new Error(
        `Failed to generate DAO contracts: ${JSON.stringify(result)}`
      );
    }

    const network = args.network || CONFIG.NETWORK;

    //console.log("Result data:", Object.keys(result.data));
    const contracts = result.data.contracts;

    // Save contracts to files if requested
    if (args.saveToFile) {
      await saveDaoContractsToFiles(contracts, args.tokenSymbol, network);
    }

    const truncatedContracts: Record<string, ContractResponse> = {};
    for (const contractData of Object.values(contracts)) {
      const contractName =
        contractData.displayName ??
        getContractDisplayName(args.tokenSymbol, contractData.name);
      if (!contractData.source) {
        throw new Error(
          `Contract ${contractName} does not have source code available`
        );
      }
      const truncatedSource =
        contractData.source.length > 100
          ? contractData.source.substring(0, 97) + "..."
          : contractData.source;

      truncatedContracts[contractName] = {
        ...contractData,
        source: truncatedSource,
      };
    }

    return {
      success: true,
      message: `Successfully generated ${
        contracts.length
      } DAO contracts for token ${args.tokenSymbol} on ${args.network}${
        args.saveToFile ? " (saved to files)" : ""
      }`,
      data: {
        ...result.data,
        contracts: Object.values(truncatedContracts),
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

// Run the main function if this file is executed directly
if (require.main === module) {
  main()
    .then(sendToLLM)
    .catch((error) => {
      sendToLLM(createErrorResponse(error));
      process.exit(1);
    });
}
