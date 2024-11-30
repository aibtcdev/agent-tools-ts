import { StxCitySDK } from 'stxcity-sdk';
import { SellBondingTokenParams } from 'stxcity-sdk/dist/types';
import {
  CONFIG,
  deriveChildAccount,
  getNetwork,
  getApiUrl
} from "../utilities";

const tokenAmount = Number(process.argv[2]);
const dexContractId = process.argv[3];
const tokenContractId = process.argv[4];
const tokenSymbol = process.argv[5];
const slippage = Number(process.argv[6]) || 50; // default 50 basis points

console.log("Token Amount:", tokenAmount);
console.log("DEX Contract ID:", dexContractId);
console.log("Token Contract ID:", tokenContractId);
console.log("Token Symbol:", tokenSymbol);
console.log("Slippage (basis points):", slippage);

if (!tokenAmount || !dexContractId || !tokenContractId || !tokenSymbol) {
  console.error("Please provide all required parameters:");
  console.error("ts-node src/stacks-bonding/exec-sell.ts <token_amount> <dex_contract_id> <token_contract_id> <token_symbol> [slippage]");
  process.exit(1);
}

const stxcityConfig = {
  HIRO_API_KEY: CONFIG.HIRO_API_KEY,
  STXCITY_API_HOST: CONFIG.STXCITY_API_HOST,
  STACKS_NETWORK_API_HOST: getApiUrl(CONFIG.NETWORK)
};

(async () => {
  try {
    const { address } = await deriveChildAccount(
      CONFIG.NETWORK,
      CONFIG.MNEMONIC,
      CONFIG.ACCOUNT_INDEX
    );

    const stxcitySDK = new StxCitySDK(getNetwork(CONFIG.NETWORK), stxcityConfig);

    const sellParams: SellBondingTokenParams = {
      tokenAmount,
      dexContractId,
      tokenContractId,
      tokenSymbol,
      senderAddress: address,
      slippage,
      onFinish: (data: any) => {
        console.log("Sell token transaction:", data);
      },
      onCancel: () => {
        console.log("Sell token transaction canceled");
      },
    };

    await stxcitySDK.sellBondingToken(sellParams);
  } catch (error) {
    console.error("Error selling bonding token:", error);
    process.exit(1);
  }
})();
