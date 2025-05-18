import { ContractApiClient } from "../api/client";
import {
  CONFIG,
  convertStringToBoolean,
  createErrorResponse,
  deriveChildAccount,
  getNextNonce,
  sendToLLM,
  ToolResponse,
  TxBroadcastResultWithLink,
} from "../../utilities";
import { deployContract, DeploymentOptions } from "../utils/deploy-contract";
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
    saveToFile,
    customReplacements: {
      dao_manifest: daoManifest,
      tweet_origin: tweetOrigin || "",
      origin_address: originAddress,
      dao_token_metadata: tokenUri,
      dao_token_symbol: tokenSymbol,
    },
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
        `Failed to generate DAO contracts: ${JSON.stringify(
          generatedContractsResponse
        )}`
      );
    }

    // Prepare for deployment

    const network = args.network || CONFIG.NETWORK;

    // Get deployment credentials
    const { address, key } = await deriveChildAccount(
      network,
      CONFIG.MNEMONIC,
      CONFIG.ACCOUNT_INDEX
    );

    // Get the current nonce for the account
    let currentNonce = await getNextNonce(network, address);

    // Deploy each contract
    const deploymentResults: Record<string, TxBroadcastResultWithLink> = {};

    //console.log("Generated contracts:", generatedContractsResponse.data);
    const contracts = generatedContractsResponse.data.contracts;

    // Save contracts to files if requested
    if (args.saveToFile) {
      await saveContractsToFiles(contracts, args.tokenSymbol, network);
    }

    const deploymentOptions: DeploymentOptions = {
      address,
      key,
      network,
      nonce: currentNonce,
    };

    for (const contractData of Object.values(contracts)) {
      const contractName = contractData.displayName
        ? contractData.displayName
        : contractData.name;

      console.log("==========================");
      console.log(
        `Deploying contract: ${contractName} with nonce ${currentNonce}`
      );

      try {
        // Deploy the contract using our utility
        const deployResult = await deployContract(
          contractData,
          deploymentOptions
        );

        if (!deployResult.success) {
          throw new Error(
            `Failed to deploy ${contractName}: ${deployResult.message}`
          );
        }

        if (!deployResult.data) {
          throw new Error(`No data returned for ${contractName}`);
        }

        deploymentResults[contractName] = deployResult.data;
        currentNonce++;
      } catch (error) {
        console.error(`Error deploying ${contractName}:`, error);
        throw error; // Stop the process if any deployment fails
      }
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

// Run the main function if this file is executed directly
if (require.main === module) {
  main()
    .then(sendToLLM)
    .catch((error) => {
      sendToLLM(createErrorResponse(error));
      process.exit(1);
    });
}
