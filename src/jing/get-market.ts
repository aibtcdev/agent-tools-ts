import { JingCashSDK } from "@jingcash/core-sdk";

if (!process.env.JING_API_URL || !process.env.JING_API_KEY) {
  console.log("Please set JING_API_URL and JING_API_KEY in your .env file");
  process.exit(1);
}

const pair = process.argv[2];

if (!pair) {
  console.log("Please provide a token pair as argument (e.g., PEPE-STX)");
  process.exit(1);
}

const sdk = new JingCashSDK({
  API_HOST: process.env.JING_API_URL,
  API_KEY: process.env.JING_API_KEY,
});

try {
  const orderBook = await sdk.getOrderBook(pair);
  console.log(JSON.stringify(orderBook, null, 2));
} catch (error) {
  console.log(error);
}
