import { JingCashSDK } from "@jingcash/core-sdk";
import { CONFIG, deriveChildAccount } from "../utilities";
import {
  getTokenSymbol,
  getTokenInfo,
  getTokenDecimals,
} from "./utils-token-pairs";
import { SwapDetails } from "./get-bid";

async function formatOutput(
  swap: SwapDetails & { contract: { address: string; name: string } }
) {
  const stxAmount = (swap.ustx / 1_000_000).toFixed(6);
  const tokenSymbol = getTokenSymbol(swap.ft);

  const tokenInfo = getTokenInfo(`${tokenSymbol}-STX`);
  if (tokenInfo) {
    try {
      swap.tokenDecimals = await getTokenDecimals(tokenInfo);
    } catch (error) {
      console.warn(
        `Warning: Could not get token decimals: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      swap.tokenDecimals = undefined;
    }
  }

  const formattedTokenAmount =
    swap.tokenDecimals !== undefined
      ? `${(swap.amount / Math.pow(10, swap.tokenDecimals)).toFixed(
          swap.tokenDecimals
        )} ${tokenSymbol} (${swap.amount} μ${tokenSymbol})`
      : `${swap.amount} μ${tokenSymbol}`;

  console.log("\nSwap Details:");
  console.log("=============");
  console.log(`Type: Ask`);
  console.log(`Status: ${swap.open ? "Open" : "Closed"}`);
  console.log(`\nAmounts:`);
  console.log(`- Token: ${formattedTokenAmount}`);
  console.log(`- STX: ${stxAmount} STX (${swap.ustx} μSTX)`);

  if (swap.tokenDecimals !== undefined) {
    console.log(`- Token Decimals: ${swap.tokenDecimals}`);
  }

  const price = swap.ustx / swap.amount;
  const adjustedPrice =
    swap.tokenDecimals !== undefined
      ? (price * Math.pow(10, swap.tokenDecimals - 6)).toFixed(8)
      : (price / 1_000_000).toFixed(8);
  console.log(`- Price per ${tokenSymbol}: ${adjustedPrice} STX`);

  console.log(`\nCounterparties:`);
  console.log(`- FT Sender: ${swap.ftSender}`);
  console.log(`- STX Sender: ${swap.stxSender || "Any"}`);

  console.log(`\nContracts:`);
  console.log(`- Token: ${swap.ft}`);
  console.log(`- Ask Contract: ${swap.contract.address}.${swap.contract.name}`);
  console.log(`- Gas fee: ${10000 / 1_000_000} STX`);

  if (swap.expiredHeight) {
    console.log(`\nExpires at block: ${swap.expiredHeight}`);
  } else {
    console.log(`\nExpires: Never unless cancelled`);
  }
}

async function getAsk(swapId: number) {
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
    const formattedSwap = await sdk.getAsk(swapId);

    if (formattedSwap) {
      await formatOutput(formattedSwap);
      return formattedSwap;
    } else {
      console.error("Failed to parse swap details");
      return null;
    }
  } catch (error: unknown) {
    console.error(
      `Error fetching ask: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
    throw error;
  }
}

// Parse command line arguments
const rawSwapId = process.argv[2];

if (rawSwapId === undefined || isNaN(parseInt(rawSwapId))) {
  console.error("Usage: bun run src/jing/get-ask.ts <swap_id>");
  console.error("Example: bun run src/jing/get-ask.ts 1");
  process.exit(1);
}

const swapId = parseInt(rawSwapId);

getAsk(swapId)
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
