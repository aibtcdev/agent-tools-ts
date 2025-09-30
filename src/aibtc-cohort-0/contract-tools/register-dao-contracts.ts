import { postToAibtcCore, getImageUrlFromTokenUri, validateNetwork, CONFIG, deriveChildAccount, ToolResponse, sendToLLM, createErrorResponse } from "../../utilities";
import { readFileSync } from "fs";
import { validateStacksAddress } from "@stacks/transactions";

// Define interfaces based on usage in deploy-dao-contracts.ts (if @aibtc/types not directly importable)
interface AibtcCoreRequestContract {
  name: string;
  type: string;
  subtype: string;
  tx_id: string;
  deployer: string;
  contract_principal: string;
}

interface AibtcCoreRequestTokenInfo {
  symbol: string;
  decimals: number;
  max_supply: string;
  uri: string;
  image_url: string;
  x_url: string;
}

interface AibtcCoreRequestBody {
  name: string;
  mission: string;
  contracts: AibtcCoreRequestContract[];
  token_info: AibtcCoreRequestTokenInfo;
}

const usage = "Usage: bun run register-dao-contracts.ts <tokenSymbol> <tokenUri> <originAddress> <daoManifest> <tweetOrigin> [network] [dry-run]";
const usageExample = 'Example: bun run register-dao-contracts.ts elonbtc "https://images.aibtc.com/storage/v1/object/public/aibtc-daos/ELONBTC-metadata.json" ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM "Make useful memes and captions for @elonmusk posts." "elonmusk" testnet dry-run';

interface ExpectedArgs {
  tokenSymbolLower: string;
  tokenSymbolUpper: string;
  tokenUri: string;
  originAddress: string;
  daoManifest: string;
  tweetOrigin: string;
  network?: string;
  dryRun?: boolean;
}

function validateArgs(): ExpectedArgs {
  const [
    tokenSymbol,
    tokenUri,
    originAddress,
    daoManifest,
    tweetOrigin,
    network = CONFIG.NETWORK,
    dryRunStr = "false",
  ] = process.argv.slice(2);

  if (!tokenSymbol) {
    const errorMessage = ["Token symbol is required", usage, usageExample].join("\n");
    throw new Error(errorMessage);
  }

  const tokenSymbolLower = tokenSymbol.toLowerCase();
  const tokenSymbolUpper = tokenSymbol.toUpperCase();

  if (!tokenUri) {
    const errorMessage = ["Token URI is required", usage, usageExample].join("\n");
    throw new Error(errorMessage);
  }

  if (!originAddress) {
    const errorMessage = ["Origin address is required", usage, usageExample].join("\n");
    throw new Error(errorMessage);
  }

  if (!validateStacksAddress(originAddress)) {
    const errorMessage = [`Invalid origin address: ${originAddress}`, usage, usageExample].join("\n");
    throw new Error(errorMessage);
  }

  if (!daoManifest) {
    const errorMessage = ["DAO manifest is required", usage, usageExample].join("\n");
    throw new Error(errorMessage);
  }

  if (!tweetOrigin) {
    const errorMessage = ["Tweet origin is required", usage, usageExample].join("\n");
    throw new Error(errorMessage);
  }

  const dryRun = dryRunStr.toLowerCase() === "true" || dryRunStr.toLowerCase() === "dry-run";

  return {
    tokenSymbolLower,
    tokenSymbolUpper,
    tokenUri,
    originAddress,
    daoManifest,
    tweetOrigin,
    network,
    dryRun,
  };
}

// Hardcoded manual tx_ids - REPLACE THESE WITH YOUR ACTUAL TRANSACTION IDs FROM MANUAL DEPLOYMENTS
// Get these from Stacks explorer (testnet: https://explorer.stacks.co/?chain=testnet) by searching your deployer address
// and filtering for "Contract Deploy" txs. Match by contract name in tx details.
const MANUAL_TX_IDS: Record<string, string> = {
  // Placeholders - FILL IN ALL ENTRIES FROM _full_response.json displayNames
  // Example format: "elonbtc-faktory": "0x123abc...", 
  // Ensure keys exactly match displayName values in JSON (case-sensitive)
  "elonbtc-faktory": "0x...",
  "elonbtc-pre-faktory": "0x...",
  "xyk-pool-sbtc-elonbtc-v-1-1": "0x...",
  "elonbtc-faktory-dex": "0x...",
  "elonbtc-base-dao": "0x...",
  "elonbtc-treasury": "0x...",
  "elonbtc-action-proposal-voting": "0x...",
  "elonbtc-dao-charter": "0x...",
  "elonbtc-dao-epoch": "0x...",
  "elonbtc-onchain-messaging": "0x...",
  "elonbtc-token-owner": "0x...",
  "elonbtc-action-send-message": "0x...",
  "elonbtc-base-initialize-dao": "0x...",
  "elonbtc-acct-swap-faktory-aibtc-sbtc": "0x...",
  "elonbtc-acct-swap-bitflow-aibtc-sbtc": "0x...",
  "elonbtc-faktory-buy-and-deposit": "0x...",
  "elonbtc-bitflow-buy-and-deposit": "0x...",
  // Add more if JSON has additional contracts
};

async function main(): Promise<ToolResponse<any>> {
  // Validate and store provided args
  const args = validateArgs();

  // Setup network and wallet info
  const currentNetwork = args.network || CONFIG.NETWORK;
  const validNetwork = validateNetwork(currentNetwork);
  const { address: deployerAddress } = await deriveChildAccount(
    currentNetwork,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  const imageUrl = await getImageUrlFromTokenUri(args.tokenUri);

  // Load generated contracts from _full_response.json (array of contract objects)
  const fullResponsePath = `./src/aibtc-cohort-0/utils/generated/${args.tokenSymbolLower}/${currentNetwork}/_full_response.json`;
  let fullResponse;
  try {
    fullResponse = JSON.parse(readFileSync(fullResponsePath, "utf8"));
  } catch (error) {
    throw new Error(`Failed to load _full_response.json from ${fullResponsePath}: ${error instanceof Error ? error.message : String(error)}`);
  }

  // The JSON is an array of contracts
  const contracts = Array.isArray(fullResponse) ? fullResponse : [];
  if (contracts.length === 0) {
    throw new Error("No contracts found in _full_response.json. Ensure the file contains an array of contract objects with name, displayName, type, subtype, etc.");
  }

  // Validate all required tx_ids are provided (match by displayName)
  const missingTxIds: string[] = [];
  contracts.forEach((contract: any) => {
    const displayName = contract.displayName;
    if (displayName && !MANUAL_TX_IDS[displayName]) {
      missingTxIds.push(displayName);
    }
  });
  if (missingTxIds.length > 0) {
    throw new Error(`Missing tx_ids for contracts: ${missingTxIds.join(", ")}. Update MANUAL_TX_IDS in the script with exact displayName keys.`);
  }

  // Construct contracts array for API using all info from JSON
  const coreRequestContracts: AibtcCoreRequestContract[] = contracts.map((contract: any) => {
    const displayName = contract.displayName || contract.name;  // Prefer displayName
    const txId = MANUAL_TX_IDS[displayName];
    const contractPrincipal = `${deployerAddress}.${displayName}`;
    return {
      name: displayName,
      type: contract.type || "unknown",  // From JSON, e.g., "TOKEN", "BASE"
      subtype: contract.subtype || "unknown",  // From JSON, e.g., "DAO", "TREASURY"
      tx_id: txId,
      deployer: deployerAddress,
      contract_principal: contractPrincipal,
    };
  });

  // Construct token info using original args and defaults
  const coreRequestTokenInfo: AibtcCoreRequestTokenInfo = {
    symbol: args.tokenSymbolUpper,
    decimals: 8,
    max_supply: "1000000000",  // 1 billion, as in original deploy
    uri: args.tokenUri,
    image_url: imageUrl,  // Extracted from tokenUri metadata
    x_url: `https://x.com/${args.tweetOrigin}`,  // From original tweetOrigin arg
  };

  // Full request body using all original info
  const aibtcRequestBody: AibtcCoreRequestBody = {
    name: args.tokenSymbolUpper,
    mission: args.daoManifest,  // Original DAO manifest/description
    contracts: coreRequestContracts,
    token_info: coreRequestTokenInfo,
  };

  console.log("==========================");
  console.log(`Reconstructed AIBTC core request body for ${args.tokenSymbolUpper} (using all data from _full_response.json + original args):`);
  console.log(JSON.stringify(aibtcRequestBody, null, 2));
  console.log("==========================");

  if (args.dryRun) {
    console.log("DRY RUN: Skipping API post to AIBTC core. Payload looks ready!");
    return {
      success: true,
      message: `Dry run successful for ${args.tokenSymbolUpper}. Found ${contracts.length} contracts from JSON. Update MANUAL_TX_IDS and run without 'dry-run' to send.`,
      data: { reconstructedPayload: aibtcRequestBody, contractsFromJson: contracts.length },
    };
  }

  // Send to AIBTC core (live run)
  console.log("Sending to AIBTC core...");
  const postResult = await postToAibtcCore(validNetwork, aibtcRequestBody);

  console.log("==========================");
  console.log(`AIBTC core response:`);
  console.log(JSON.stringify(postResult, null, 2));
  console.log("==========================");

  const successMessage = `Successfully registered ${contracts.length} DAO contracts for ${args.tokenSymbolUpper} using original deployment info`;

  return {
    success: true,
    message: successMessage,
    data: postResult,
  };
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
