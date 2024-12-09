import { StxCitySDK } from 'stxcity-sdk';
import { BondingTokenData, BondingTokenItem } from 'stxcity-sdk/dist/types';
import {
  CONFIG,
  getNetwork,
  getApiUrl
} from "../utilities";

const LIMIT = 100; // Maximum limit per page

const stxcityConfig = {
  HIRO_API_KEY: CONFIG.HIRO_API_KEY,
  STXCITY_API_HOST: CONFIG.STXCITY_API_HOST,
  STACKS_NETWORK_API_HOST: getApiUrl(CONFIG.NETWORK)
};

(async () => {
  try {
    const stxcitySDK = new StxCitySDK(getNetwork(CONFIG.NETWORK), stxcityConfig);
    let page = 1;
    let hasMoreData = true;
    const allBondingTokens: BondingTokenItem[] = [];

    console.log("Fetching all bonding tokens...");

    while (hasMoreData) {
      console.log(`\nFetching page ${page}...`);
      const bondingTokenData: BondingTokenData = await stxcitySDK.getBondingToken(page, LIMIT);
      
      if (!bondingTokenData || !bondingTokenData.all || bondingTokenData.all.length === 0) {
        hasMoreData = false;
        break;
      }

      allBondingTokens.push(...bondingTokenData.all);
      console.log(`Found ${bondingTokenData.all.length} tokens on page ${page}`);
      console.log(`Total tokens so far: ${allBondingTokens.length}`);
      console.log(`Total available: ${bondingTokenData.total}`);
      
      // Check if we've reached the last page
      if (page * LIMIT >= bondingTokenData.total) {
        hasMoreData = false;
      } else {
        page++;
      }
    }

    console.log("\nTotal bonding tokens found:", allBondingTokens.length);
    console.log("\nBonding Tokens List:");
    allBondingTokens.forEach((token, index) => {
      console.log(`\n${index + 1}. Token Details:`);
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

  } catch (error) {
    console.error("Error fetching bonding tokens:", error);
    process.exit(1);
  }
})();
