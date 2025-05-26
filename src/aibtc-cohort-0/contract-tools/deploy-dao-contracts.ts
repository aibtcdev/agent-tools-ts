import { ContractApiClient } from "../api/client";
import {
  aibtcCoreRequestBody,
  aibtcCoreRequestBodyV2,
  aibtcCoreRequestContract,
  aibtcCoreRequestTokenInfo,
  CONFIG,
  convertStringToBoolean,
  createErrorResponse,
  deriveChildAccount,
  FaktoryRequestBody,
  getFaktoryContracts,
  getImageUrlFromTokenUri,
  getNextNonce,
  postToAibtcCore,
  sendToLLM,
  ToolResponse,
  validateNetwork,
} from "../../utilities";
import {
  BroadcastedContractResponse,
  BroadcastedAndPostedResponse,
  deployContract,
  DeploymentOptions,
} from "../utils/deploy-contract";
import { validateStacksAddress } from "@stacks/transactions";
import { saveDaoContractsToFiles } from "../utils/save-contract";
import { ContractResponse, CONTRACT_NAMES } from "@aibtc/types";

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

async function main(): Promise<ToolResponse<BroadcastedAndPostedResponse>> {
  // validate and store provided args
  const args = validateArgs();

  // Setup network, wallet info, and image URL early
  const currentNetwork = args.network || CONFIG.NETWORK;
  const validNetwork = validateNetwork(currentNetwork);
  const { address, key } = await deriveChildAccount(
    currentNetwork,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  const imageUrl = await getImageUrlFromTokenUri(args.tokenUri);

  // create new api client for aibtcdev-daos API
  const apiClient = new ContractApiClient();

  try {
    // Generate all DAO contracts
    const generatedContractsResponse = await apiClient.generateDaoContracts(
      currentNetwork, // Use consistent network variable
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

    const contractsToProcess = generatedContractsResponse.data!.contracts;

    // Get latest faktory contracts from endpoint and update source/hash
    const faktoryRequestBody: FaktoryRequestBody = {
      symbol: args.tokenSymbolLower,
      name: args.tokenSymbolLower,
      supply: 1000000000, // Default supply, consistent with generator
      creatorAddress: address,
      originAddress: args.originAddress,
      uri: args.tokenUri,
      logoUrl: imageUrl, // Use imageUrl fetched earlier
      description: args.daoManifest,
      tweetOrigin: args.tweetOrigin || "",
    };
    const {
      prelaunch: faktoryPrelaunch,
      token: faktoryToken,
      dex: faktoryDex,
      pool: faktoryPool,
    } = await getFaktoryContracts(faktoryRequestBody);

    // Find matching contracts from our generated contracts and update their source and hash
    const prelaunchMatch = contractsToProcess.find(
      (c) => c.name === CONTRACT_NAMES.TOKEN.PRELAUNCH
    );
    const tokenMatch = contractsToProcess.find(
      (c) => c.name === CONTRACT_NAMES.TOKEN.DAO
    );
    const dexMatch = contractsToProcess.find(
      (c) => c.name === CONTRACT_NAMES.TOKEN.DEX
    );
    const poolMatch = contractsToProcess.find(
      (c) => c.name === CONTRACT_NAMES.TOKEN.POOL
    );

    if (!prelaunchMatch || !tokenMatch || !dexMatch || !poolMatch) {
      throw new Error(
        `Failed to find all required Faktory contracts (prelaunch, token, dex, pool) in generated contracts list.`
      );
    }

    prelaunchMatch.source = faktoryPrelaunch.code;
    prelaunchMatch.hash = faktoryPrelaunch.hash;
    tokenMatch.source = faktoryToken.code;
    tokenMatch.hash = faktoryToken.hash;
    dexMatch.source = faktoryDex.code;
    dexMatch.hash = faktoryDex.hash;
    poolMatch.source = faktoryPool.code;
    poolMatch.hash = faktoryPool.hash;

    // Prepare for deployment (network, address, key, validNetwork are already set up)
    // Get the current nonce for the account
    let currentNonce = await getNextNonce(currentNetwork, address);

    // Deploy each contract
    const deploymentResults: Record<string, BroadcastedContractResponse> = {};

    //console.log("Generated contracts:", contractsToProcess); // Updated variable
    // sort them by deployment order
    const contracts = contractsToProcess.sort( // Use the updated contractsToProcess list
      (a, b) => a.deploymentOrder - b.deploymentOrder
    );

    // Save contracts to files if requested
    if (args.saveToFile) {
      await saveDaoContractsToFiles(contracts, args.tokenSymbolLower, network);
    }

    const deploymentOptions: DeploymentOptions = {
      address,
      key,
      network,
      nonce: currentNonce,
    };

    for (const contractData of Object.values(contracts)) {
      const contractName = contractData.displayName ?? contractData.name;

      //console.log("==========================");
      //console.log(
      //  `Deploying contract: ${contractName} with nonce ${currentNonce}`
      //);

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

        const deployResultData = deployResult.data;
        const contractSource = deployResultData.source ?? "";
        const truncatedSource =
          contractSource.length > 100
            ? contractSource.substring(0, 97) + "..."
            : contractSource;

        deploymentResults[contractName] = {
          ...deployResultData,
          source: truncatedSource,
        };
        currentNonce++;
      } catch (error) {
        //console.error(`Error deploying ${contractName}:`, error);
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

    // imageUrl was already fetched earlier for Faktory request and can be reused here.

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

    const coreRequestContracts: aibtcCoreRequestContract[] = contracts.map(
      (contract) =>
        ({
          name: contract.name,
          display_name: contract.displayName!,
          type: contract.type,
          subtype: contract.subtype,
          tx_id: deploymentResults[contract.name]?.txid!,
          deployer: address,
          contract_principal: `${address}.${contract.name}`,
        } satisfies aibtcCoreRequestContract)
    );

    const coreRequestTokenInfo: aibtcCoreRequestTokenInfo = {
      symbol: `${args.tokenSymbolUpper}•AIBTC•DAO`,
      decimals: 8,
      max_supply: "1000000000", // 1 billion
      uri: args.tokenUri,
      image_url: imageUrl,
      x_url: `https://x.com/${args.tweetOrigin}`,
    };

    const aibtcRequestBodyV2: aibtcCoreRequestBodyV2 = {
      name: `${args.tokenSymbolUpper}•AIBTC•DAO`,
      mission: args.daoManifest,
      contracts: coreRequestContracts,
      token_info: coreRequestTokenInfo,
    };

    const { extensions } = aibtcRequestBody;
    const fixedExtensions = extensions.map((ext) => {
      const sourceLength = ext.source?.length || 0;
      return {
        ...ext,
        source:
          sourceLength > 100
            ? `${ext.source?.substring(0, 97)}...`
            : ext.source,
      };
    });
    aibtcRequestBody.extensions = fixedExtensions as ContractResponse[];

    console.log("==========================");
    console.log(`Posting to AIBTC core with request body:`);
    console.log(JSON.stringify(aibtcRequestBody, null, 2));
    console.log("==========================");

    const postResult = await postToAibtcCore(validNetwork, aibtcRequestBody);

    console.log("==========================");
    console.log(`Post result from AIBTC core:`);
    console.log(JSON.stringify(postResult, null, 2));
    console.log("==========================");

    const successMessage = `Successfully deployed ${
      Object.keys(deploymentResults).length
    } DAO contracts for token ${args.tokenSymbolUpper}`;

    return {
      success: true,
      message: successMessage,
      data: {
        broadcastedContracts: deploymentResults,
        aibtcCoreResponse: postResult,
      },
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
