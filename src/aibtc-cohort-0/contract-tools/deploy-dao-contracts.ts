import { ContractApiClient } from "../api/client";
import {
  aibtcCoreRequestBody,
  CONFIG,
  convertStringToBoolean,
  createErrorResponse,
  deriveChildAccount,
  getExplorerUrl,
  getImageUrlFromTokenUri,
  getNextNonce,
  postToAibtcCore,
  sendToLLM,
  ToolResponse,
  TxBroadcastResultWithLink,
  validateNetwork,
} from "../../utilities";
import { deployContract, DeploymentOptions } from "../utils/deploy-contract";
import { validateStacksAddress } from "@stacks/transactions";
import { saveContractsToFiles } from "./generate-dao-contracts";

const usage =
  "Usage: bun run deploy-dao-contracts.ts <tokenSymbol> <tokenUri> <originAddress> <daoManifest> [tweetOrigin] [network] [saveToFile]";
const usageExample =
  'Example: bun run deploy-dao-contracts.ts MYTOKEN "https://example.com/token.json" ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM "This is my DAO" "1894855072556912681" "testnet" true';

interface ExpectedArgs {
  tokenSymbolLower: string;
  tokenSymbolUpper: string;
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

  const tokenSymbolLower = tokenSymbol.toLowerCase();
  const tokenSymbolUpper = tokenSymbol.toUpperCase();

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
    tokenSymbolLower,
    tokenSymbolUpper,
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
      dao_token_symbol: tokenSymbolLower,
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
      args.tokenSymbolLower,
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
    const validNetwork = validateNetwork(network);

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
    // sort them by deployment order
    const contracts = generatedContractsResponse.data.contracts.sort(
      (a, b) => a.deploymentOrder - b.deploymentOrder
    );

    // Save contracts to files if requested
    if (args.saveToFile) {
      await saveContractsToFiles(contracts, args.tokenSymbolLower, network);
    }

    const deploymentOptions: DeploymentOptions = {
      address,
      key,
      network,
      nonce: currentNonce,
    };

    for (const contractData of Object.values(contracts)) {
      const contractName = contractData.displayName ?? contractData.name;

      console.log("==========================");
      console.log(
        `Deploying contract: ${contractName} with nonce ${currentNonce}`
      );

      try {
        // Deploy the contract using our utility
        const deployResult = await deployContract(contractData, {
          ...deploymentOptions,
          nonce: currentNonce,
        });

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

    // find the token contract deployment entry
    const tokenContractName = `${args.tokenSymbolLower}-faktory`;
    const tokenDeploymentResult = deploymentResults[tokenContractName];
    if (!tokenDeploymentResult) {
      throw new Error(
        `Token contract ${tokenContractName} not found in deployment results`
      );
    }

    // fetch token URI, get image link
    const imageUrl = await getImageUrlFromTokenUri(args.tokenUri);

    // post result to AIBTC core
    const aibtcRequestBody: aibtcCoreRequestBody = {
      name: `${args.tokenSymbolUpper}•AIBTC•DAO`,
      mission: args.daoManifest,
      description: args.daoManifest,
      extensions: contracts,
      token: {
        name: `${args.tokenSymbolUpper}•AIBTC•DAO`,
        symbol: `${args.tokenSymbolUpper}•AIBTC•DAO`,
        decimals: 8,
        description: `${args.tokenSymbolUpper}•AIBTC•DAO`,
        max_supply: "1000000000", // 1 billion
        uri: args.tokenUri,
        tx_id: tokenDeploymentResult.txid,
        contract_principal: `${address}.${tokenContractName}`,
        image_url: imageUrl,
      },
    };
    const postResult = postToAibtcCore(validNetwork, aibtcRequestBody);

    console.log(`Posted to AIBTC core: ${JSON.stringify(postResult, null, 2)}`);

    const successMessage = [
      `Successfully deployed ${
        Object.keys(deploymentResults).length
      } DAO contracts for token ${args.tokenSymbolUpper}`,
      `Deployment results:`,
      ...Object.entries(deploymentResults).map(
        ([name, result]) => `${name}: ${getExplorerUrl(network, result.txid)}`
      ),
    ].join("\n");

    return {
      success: true,
      message: successMessage,
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
