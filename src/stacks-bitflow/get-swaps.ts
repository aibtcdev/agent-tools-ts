import { BitflowSDK } from "bitflow-sdk";

const bitflow = new BitflowSDK({
  API_HOST: process.env.BITFLOW_API_HOST,
  API_KEY: process.env.BITFLOW_API_KEY,
  STACKS_API_HOST: process.env.BITFLOW_STACKS_API_HOST,
  READONLY_CALL_API_HOST: process.env.BITFLOW_READONLY_CALL_API_HOST,
});

const token = process.argv[2];

if (!token) {
  console.log("Please provide a token name as argument");
  process.exit(1);
}

try {
  const possibleTokens = await bitflow.getAllPossibleTokenY(token);
  console.log(JSON.stringify(possibleTokens, null, 2));
} catch (error) {
  console.log(error);
}
