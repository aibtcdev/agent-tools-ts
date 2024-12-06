import { StxCitySDK } from 'stxcity-sdk';
import {
  CONFIG,
  getNetwork,
  getApiUrl
} from "../utilities";

const dexContractId = process.argv[2];
const tokenContractId = process.argv[3];

console.log("DEX Contract ID:", dexContractId);
console.log("Token Contract ID:", tokenContractId);

if (!dexContractId || !tokenContractId) {
  console.error("Please provide both DEX Contract ID and Token Contract ID");
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
    
    const isValid = await stxcitySDK.checkValidBonding(dexContractId, tokenContractId);
    
    if (isValid) {
      console.log("✅ The bonding token is valid");
    } else {
      console.log("❌ The bonding token is not valid");
    }
  } catch (error) {
    console.error("Error checking bonding token validity:", error);
    process.exit(1);
  }
})();
