import { StxCitySDK } from 'stxcity-sdk';
import { SearchTokenParams, SearchTokenType } from 'stxcity-sdk/dist/types';
import {
  CONFIG,
  getNetwork,
  getApiUrl
} from "../utilities";

const keyword = process.argv[2];
const tokenContract = process.argv[3];

console.log("Search Keyword:", keyword || "Not provided");
console.log("Token Contract:", tokenContract || "Not provided");

if (!keyword && !tokenContract) {
  console.error("Please provide at least one search parameter:");
  console.error("ts-node src/stacks-bonding/exec-search.ts [keyword] [token_contract]");
  process.exit(1);
}

const stxcityConfig = {
  HIRO_API_KEY: CONFIG.HIRO_API_KEY,
  STXCITY_API_HOST: CONFIG.STXCITY_API_HOST,
  STACKS_NETWORK_API_HOST: getApiUrl(CONFIG.NETWORK)
};

(async () => {
  try {
    const stxcitySDK = new StxCitySDK(getNetwork(CONFIG.NETWORK), stxcityConfig);

    const params: SearchTokenParams = {
      ...(keyword && { keyword }),
      ...(tokenContract && { tokenContract })
    };

    const searchResults: SearchTokenType = await stxcitySDK.searchToken(params);

    // Display Bonding Curve Tokens
    if (searchResults.bonding_curve.length > 0) {
      console.log("\nBonding Curve Tokens Found:", searchResults.bonding_curve.length);
      searchResults.bonding_curve.forEach((token, index) => {
        console.log(`\n${index + 1}. Bonding Token:`);
        console.log(`   Name: ${token.name}`);
        console.log(`   Symbol: ${token.symbol}`);
        console.log(`   DEX Contract: ${token.dex_contract}`);
        console.log(`   Token Contract: ${token.token_contract}`);
        console.log(`   Status: ${token.status}`);
        console.log(`   Progress: ${token.progress}%`);
        console.log(`   Holders: ${token.holders}`);
        if (token.price) console.log(`   Price: ${token.price}`);
        if (token.trading_volume) console.log(`   Trading Volume: ${token.trading_volume}`);
        if (token.target_stx) console.log(`   Target STX: ${token.target_stx}`);
      });
    } else {
      console.log("\nNo bonding curve tokens found.");
    }

    // Display Normal Tokens
    if (searchResults.normal.length > 0) {
      console.log("\nNormal Tokens Found:", searchResults.normal.length);
      searchResults.normal.forEach((token, index) => {
        console.log(`\n${index + 1}. Normal Token:`);
        console.log(`   Name: ${token.name}`);
        console.log(`   Symbol: ${token.symbol}`);
        console.log(`   Contract ID: ${token.contract_id}`);
        console.log(`   Holders: ${token.holders}`);
        console.log(`   Supply: ${token.supply}`);
        console.log(`   Decimals: ${token.decimals}`);
        if (token.homepage) console.log(`   Homepage: ${token.homepage}`);
      });
    } else {
      console.log("\nNo normal tokens found.");
    }

    // Display Advertisement Tokens
    if (searchResults.ads_tokens.length > 0) {
      console.log("\nAdvertised Tokens Found:", searchResults.ads_tokens.length);
      searchResults.ads_tokens.forEach((token, index) => {
        console.log(`\n${index + 1}. Advertised Token:`);
        console.log(`   Name: ${token.name}`);
        console.log(`   Symbol: ${token.symbol}`);
        console.log(`   DEX Contract: ${token.dex_contract}`);
        console.log(`   Token Contract: ${token.token_contract}`);
        console.log(`   Status: ${token.status}`);
        if (token.price) console.log(`   Price: ${token.price}`);
        if (token.trading_volume) console.log(`   Trading Volume: ${token.trading_volume}`);
      });
    } else {
      console.log("\nNo advertised tokens found.");
    }

  } catch (error) {
    console.error("Error searching tokens:", error);
    process.exit(1);
  }
})();
