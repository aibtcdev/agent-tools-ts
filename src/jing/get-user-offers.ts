import { CONFIG, deriveChildAccount } from "../utilities";
import { JingCashSDK } from "@jingcash/core-sdk";

if (!process.env.JING_API_URL || !process.env.JING_API_KEY) {
  console.log("Please set JING_API_URL and JING_API_KEY in your .env file");
  process.exit(1);
}

const [pair, userAddress] = process.argv.slice(2);

if (!pair || !userAddress) {
  console.log("Usage: get-user-offers <pair> <userAddress>");
  console.log(
    "Example: bun src/jing/get-user-offers.ts PEPE-STX SP29D6YMDNAKN1P045T6Z817RTE1AC0JAA99WAX2B"
  );
  process.exit(1);
}

const { address } = await deriveChildAccount(
  CONFIG.NETWORK,
  CONFIG.MNEMONIC,
  CONFIG.ACCOUNT_INDEX
);

const jingcash = new JingCashSDK({
  API_HOST: process.env.JING_API_URL,
  API_KEY: process.env.JING_API_KEY,
  defaultAddress: address,
  network: CONFIG.NETWORK,
});

try {
  const userOffers = await jingcash.getUserOffers(pair, userAddress);
  console.log(JSON.stringify(userOffers, null, 2));
} catch (error) {
  console.log(error);
}
