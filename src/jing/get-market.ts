import { CONFIG, deriveChildAccount } from "../utilities";
import { JingCashSDK } from "@jingcash/core-sdk";

async function getOrderBook(pair: string) {
  const { address } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );

  const sdk = new JingCashSDK({
    API_HOST:
      process.env.JING_API_URL || "https://backend-neon-ecru.vercel.app/api",
    API_KEY: process.env.JING_API_KEY || "dev-api-token",
    defaultAddress: address,
    network: CONFIG.NETWORK,
  });

  try {
    const orderBook = await sdk.getOrderBook(pair);
    console.log(JSON.stringify(orderBook, null, 2));
  } catch (error) {
    console.log(error);
  }
}

// Parse command line arguments
const pair = process.argv[2];

if (!pair) {
  console.log("Please provide a token pair as argument (e.g., PEPE-STX)");
  process.exit(1);
}

getOrderBook(pair)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\nError:", error.message);
    process.exit(1);
  });
