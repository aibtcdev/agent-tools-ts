import { ContractApiClient } from "../api/client";
import {
  CONFIG,
  convertStringToBoolean,
  createErrorResponse,
  isValidContractPrincipal,
  sendToLLM,
  ToolResponse,
  TxBroadcastResultWithLink,
} from "../../utilities";
import { deployContract } from "../utils/deploy-contract";
import { validateStacksAddress } from "@stacks/transactions";
import { saveContractsToFiles } from "./generate-dao-contracts";

const usage =
  "Usage: bun run deploy-dao-contracts.ts <tokenSymbol> <tokenUri> <originAddress> <daoManifest> [tweetOrigin] [network] [saveToFile]";
const usageExample =
  'Example: bun run deploy-dao-contracts.ts MYTOKEN "https://example.com/token.json" ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM "This is my DAO" "1894855072556912681" "testnet" true';

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

  if (!originAddress) {
    const errorMessage = [
      "Origin address is required",
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  if (!validateStacksAddress(originAddress)) {
    const errorMessage = [
      `Invalid origin address: ${originAddress}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  if (!daoManifest) {
    const errorMessage = ["DAO manifest is required", usage, usageExample].join(
      "\n"
    );
    throw new Error(errorMessage);
  }

  if (!tweetOrigin) {
    const errorMessage = ["Tweet origin is required", usage, usageExample].join(
      "\n"
    );
    throw new Error(errorMessage);
  }

  const saveToFile = convertStringToBoolean(saveToFileStr);

  return {
    tokenSymbol,
    tokenUri,
    originAddress,
    daoManifest,
    tweetOrigin,
    network,
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

async function main(): Promise<
  ToolResponse<Record<string, TxBroadcastResultWithLink>>
> {
  const args = validateArgs();
  const apiClient = new ContractApiClient();

  try {
    // Generate all DAO contracts
    const generatedContractsResponse = await apiClient.generateDaoContracts(
      args.network,
      args.tokenSymbol,
      args.customReplacements
    );

    if (
      !generatedContractsResponse.success ||
      !generatedContractsResponse.data
    ) {
      if (generatedContractsResponse.error) {
        throw new Error(generatedContractsResponse.error.message);
      }
      throw new Error(
        `Failed to generate DAO contracts: ${JSON.stringify(generatedContractsResponse)}`
      );
    }

    // Prepare for deployment

    const network = args.network || CONFIG.NETWORK;

    // Deploy each contract
    const deploymentResults: Record<string, TxBroadcastResultWithLink> = {};

    //console.log("Generated contracts:", generatedContractsResponse.data);
    const contracts = generatedContractsResponse.data.contracts;

    // Save contracts to files if requested
    if (args.saveToFile) {
      await saveContractsToFiles(contracts, args.tokenSymbol, network);
    }

    
    for (const [key, contractData] of Object.entries(contracts)) {
      // Use the contract's name property if available, otherwise use the key
      const contractName = contractData.name || key;
      console.log(`Deploying contract: ${contractName}`);

      // Deploy the contract
      const deployResult = await deployContract({
        contractName: contractName,
        sourceCode:
          contractData.source
        clarityVersion: contractData.clarityVersion,
      });

      deploymentResults[contractName] = deployResult;
    }

    return {
      success: true,
      message: `Successfully deployed ${
        Object.keys(deploymentResults).length
      } DAO contracts for token ${args.tokenSymbol}`,
      data: deploymentResults,
    };
  } catch (error) {
    const errorMessage = [
      `Error deploying DAO contracts:`,
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

export async function deployDaoContracts(params: DeployDaoParams) {
  const {
    tokenSymbol,
    tokenName,
    tokenMaxSupply,
    tokenUri,
    logoUrl,
    originAddress,
    daoManifest,
    tweetOrigin,
    daoManifestInscriptionId,
    network = CONFIG.NETWORK,
  } = params;

  // Generate contracts using the API
  const apiClient = new ContractApiClient();
  const customReplacements = {
    token_symbol: tokenSymbol,
    token_name: tokenName,
    token_max_supply: tokenMaxSupply.toString(),
    token_uri: tokenUri,
    logo_url: logoUrl,
    origin_address: originAddress,
    dao_manifest: daoManifest,
    tweet_origin: tweetOrigin,
    dao_manifest_inscription_id: daoManifestInscriptionId || "",
  };

  // Generate all DAO contracts
  const generatedContractsResponse = await apiClient.generateDaoContracts(
    network,
    tokenSymbol,
    customReplacements
  );

  if (!generatedContractsResponse.success || !generatedContractsResponse.data) {
    console.error("Failed to generate DAO contracts:");
    console.error(JSON.stringify(generatedContractsResponse, null, 2));
    throw new Error(
      `Failed to generate DAO contracts: ${
        generatedContractsResponse.message || "Unknown error"
      }`
    );
  }

  // Here you would typically deploy these contracts
  // For now, we'll just return the generated contracts
  return generatedContractsResponse;
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
