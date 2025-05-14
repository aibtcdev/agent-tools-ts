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
import { validateStacksAddress } from "@stacks/transactions";

const usage =
  "Usage: bun run deploy-dao-contracts.ts <tokenSymbol> <tokenName> <tokenMaxSupply> <tokenUri> <logoUrl> <originAddress> <daoManifest> <tweetOrigin> [daoManifestInscriptionId] [network]";
const usageExample =
  'Example: bun run deploy-dao-contracts.ts MYTOKEN "My Token" 1000000 "https://example.com/token.json" "https://example.com/logo.png" ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM "This is my DAO" "https://twitter.com/mytweet"';

interface ExpectedArgs {
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

function validateArgs(): ExpectedArgs {
  const [
    tokenSymbol,
    tokenName,
    tokenMaxSupplyStr,
    tokenUri,
    logoUrl,
    originAddress,
    daoManifest,
    tweetOrigin,
    daoManifestInscriptionId,
    network = CONFIG.NETWORK,
  ] = process.argv.slice(2);

  if (!tokenSymbol) {
    const errorMessage = ["Token symbol is required", usage, usageExample].join(
      "\n"
    );
    throw new Error(errorMessage);
  }

  if (!tokenName) {
    const errorMessage = ["Token name is required", usage, usageExample].join(
      "\n"
    );
    throw new Error(errorMessage);
  }

  if (!tokenMaxSupplyStr) {
    const errorMessage = [
      "Token max supply is required",
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  const tokenMaxSupply = parseInt(tokenMaxSupplyStr);
  if (isNaN(tokenMaxSupply) || tokenMaxSupply <= 0) {
    const errorMessage = [
      `Invalid token max supply: ${tokenMaxSupplyStr}. Must be a positive number.`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  if (!tokenUri) {
    const errorMessage = ["Token URI is required", usage, usageExample].join(
      "\n"
    );
    throw new Error(errorMessage);
  }

  if (!logoUrl) {
    const errorMessage = ["Logo URL is required", usage, usageExample].join(
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

  return {
    tokenSymbol,
    tokenName,
    tokenMaxSupply,
    tokenUri,
    logoUrl,
    originAddress,
    daoManifest,
    tweetOrigin,
    daoManifestInscriptionId,
    network,
  };
}

async function main(): Promise<
  ToolResponse<Record<string, TxBroadcastResultWithLink>>
> {
  const args = validateArgs();
  const apiClient = new ContractApiClient();

  try {
    // Prepare custom replacements for contract generation
    const customReplacements = {
      token_symbol: args.tokenSymbol,
      token_name: args.tokenName,
      token_max_supply: args.tokenMaxSupply.toString(),
      token_uri: args.tokenUri,
      logo_url: args.logoUrl,
      origin_address: args.originAddress,
      dao_manifest: args.daoManifest,
      tweet_origin: args.tweetOrigin,
      dao_manifest_inscription_id: args.daoManifestInscriptionId || "",
    };

    // Generate all DAO contracts
    const generatedContractsResponse = await apiClient.generateDaoContracts(
      args.network,
      args.tokenSymbol,
      customReplacements
    );

    if (
      !generatedContractsResponse.success ||
      !generatedContractsResponse.data
    ) {
      console.error("Failed to generate DAO contracts:");
      console.error(JSON.stringify(generatedContractsResponse, null, 2));
      return {
        success: false,
        message: `Failed to generate DAO contracts: ${
          generatedContractsResponse.message || "Unknown error"
        }`,
      };
    }

    // Prepare for deployment

    // Deploy each contract
    const deploymentResults: Record<string, TxBroadcastResultWithLink> = {};
    // Check if contracts are in data.contracts or directly in data
    const contracts = generatedContractsResponse.data.contracts || generatedContractsResponse.data;

    for (const [key, contractData] of Object.entries(contracts)) {
      // Use the contract's name property if available, otherwise use the key
      const contractName = contractData.name || key;
      console.log(`Deploying contract: ${contractName}`);

      // Deploy the contract
      const deployResult = await deployContract({
        contractName: contractName,
        sourceCode: contractData.source || contractData.content || contractData.code,
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
    throw new Error(`Failed to generate DAO contracts: ${
      generatedContractsResponse.message || "Unknown error"
    }`);
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
