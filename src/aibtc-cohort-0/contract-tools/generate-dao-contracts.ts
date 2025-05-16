import fs from "node:fs";
import path from "node:path";
import { ContractApiClient } from "../api/client";
import {
  CONFIG,
  convertStringToBoolean,
  createErrorResponse,
  sendToLLM,
  ToolResponse,
} from "../../utilities";
import { validateStacksAddress } from "@stacks/transactions";
import {
  GeneratedDaoContractsResponse,
  ContractResponse
} from "@aibtc/types";

const displayName = (symbol: string, name: string) =>
  name.replace("aibtc", symbol).toLowerCase();

// copy of expectedArgs below
// keeping for deploy dao script?
interface GenerateDaoParams {
  tokenSymbol: string;
  tokenUri: string;
  originAddress: string;
  daoManifest: string;
  tweetOrigin?: string;
  network?: string;
  customReplacements?: Record<string, string>;
  saveTofile?: boolean;
}

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
  customReplacements?: Record<string, string>;
  saveToFile?: boolean;
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
    customReplacements: {
      dao_manifest: daoManifest,
      tweet_origin: tweetOrigin || "",
      origin_address: originAddress,
      dao_token_metadata: tokenUri,
      dao_token_symbol: tokenSymbol,
    },
    saveToFile,
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

    // Check if contracts are in data.contracts or directly in data
    console.log("Result data:", Object.keys(result.data));

    const contracts = result.data.contracts;

    // Save contracts to files if requested
    if (args.saveToFile) {
      await saveContractsToFiles(contracts, args.tokenSymbol, network);
    }

    const truncatedContracts: Record<string, ContractResponse> = {};
    for (const contractData of Object.values(contracts)) {
      const contractName = displayName(args.tokenSymbol, contractData.name);
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

/**
 * Save generated contracts to files in the contract-tools/generated directory
 */
async function saveContractsToFiles(
  contracts: ContractResponse[],
  tokenSymbol: string,
  network: string
) {

  // Create the directory if it doesn't exist
  const outputDir = path.join(__dirname, "generated", tokenSymbol, network);
  fs.mkdirSync(outputDir, { recursive: true });

  // Save each contract to a file
  for (const contractData of contracts) {
    // Use the contract's name property if available
    const contractName = displayName(tokenSymbol, contractData.name);
    const filePath = path.join(outputDir, `${contractName}.clar`);
    if (!contractData.source) {
      throw new Error(
        `Contract ${contractName} does not have source code available`
      );
    }
    const sourceCode = contractData.source!;
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
