import { BitflowSDK } from "bitflow-sdk";

const bitflow = new BitflowSDK({
  API_HOST: process.env.BITFLOW_API_HOST,
  API_KEY: process.env.BITFLOW_API_KEY,
  STACKS_API_HOST: process.env.BITFLOW_STACKS_API_HOST,
  READONLY_CALL_API_HOST: process.env.BITFLOW_READONLY_CALL_API_HOST,
});

try {
  const tokens = await bitflow.getAvailableTokens();
  console.log(JSON.stringify(tokens, null, 2));
} catch (error) {
  console.log(error);
}
