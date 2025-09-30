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

const MANUAL_TX_IDS: Record<string, string> = {
  "elonbtc-faktory": "0x318f19c6605ae4f83c523ba5fb99b1d5390e08f0e76da72d366a9b8205152248",
  "elonbtc-pre-faktory": "0x8836e5cfc2c4cac84b5d25ec2bb9b20f1bf2c613bfc80dc5c3bbedb8775fbd93",
  "xyk-pool-sbtc-elonbtc-v-1-1": "0x039f0faf39ce7b9c04244a44ea2698b24b17afe6a9e321309e569f6b0df38aca",
  "elonbtc-faktory-dex": "0x3f3e217d05d856bd86482e39543476a37b4710417f2fd0e801dc1836068e9c2f",
  "elonbtc-base-dao": "0xa81f9195c8044cc75662fe1469288ebcd5b0e56cb10ff11d3b1a127324561344",
  "elonbtc-treasury": "0xae6a23137881bddfdd19f8aabfbdcf55b338f1bebb8afd06de89d993b1ad745b",
  "elonbtc-action-proposal-voting": "0x71b6bce85db507ccc652723c01e0b242ede707889521fea9b7ffa3faaf4a5be7",
  "elonbtc-dao-charter": "0xadcab9466bd94805e6ea1fa4c134e60878e3b8235102c9eb37d209327f1373e7",
  "elonbtc-dao-epoch": "0x7c8df909f9283b5d49d154bd5cd7d455148906f639872dbb5397fdf61313599c",
  "elonbtc-onchain-messaging": "0x5dc5d982f5589f03ceaf6524543e5bfcd3f2a4fe4f4e6a0f159eff5b802d9db7",
  "elonbtc-token-owner": "0x070487124d4d306cad829da9ac07dc310070e66b9b03f73598b74b55c6163d27",
  "elonbtc-action-send-message": "0x186ca9754d533171d1b4ea64c31256b3d7bac18e6c3ef9bf1fb8d9c5c4f3ecee",
  "elonbtc-base-initialize-dao": "0x8a4a98fe20e41b141c6d75d2a095a1e01ab48aaa0efb6cda273d6db95ce72abb",
  "elonbtc-acct-swap-faktory-aibtc-sbtc": "0xb8026abcbb432d5d0df77c42fefe4e15bece39f63a67ddf84ea7b6869ead42e6",
  "elonbtc-acct-swap-bitflow-aibtc-sbtc": "0xd8a4cabb7bc9d8469c30a47a3814199863e9b716629c4c7de29b5087a991dcf1",
  "elonbtc-faktory-buy-and-deposit": "0xe10ab503adf9a6bc5518ad5c186961bdbec2a8e7353568349fadd920db4c3dd1",
  "elonbtc-bitflow-buy-and-deposit": "0x5131c45d2846a9e281550a38cbba986670b9d68a73471562c1cf338c82589234",
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
