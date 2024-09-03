import { BitflowSDK } from "bitflow-sdk";

const bitflow = new BitflowSDK({
  API_HOST: process.env.BITFLOW_API_HOST,
  API_KEY: process.env.BITFLOW_API_KEY,
  STACKS_API_HOST: process.env.BITFLOW_STACKS_API_HOST,
  READONLY_CALL_API_HOST: process.env.BITFLOW_READONLY_CALL_API_HOST,
});

const tokenX = process.argv[2];
const tokenY = process.argv[3];

if (!tokenX || !tokenY) {
  console.log("Please provide two token names as arguments");
  process.exit(1);
}

try {
  const routes = await bitflow.getAllPossibleTokenYRoutes(tokenX, tokenY);
  console.log(JSON.stringify(routes, null, 2));
} catch (error) {
  console.log(error);
}
