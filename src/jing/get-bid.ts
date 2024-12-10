// get-bid.ts

import { JingCashSDK } from "@jingcash/core-sdk";
import { CONFIG, deriveChildAccount } from "../utilities";

export interface SwapDetails {
  ustx: number;
  stxSender: string;
  amount: number;
  ftSender: string | null;
  open: boolean;
  ft: string;
  fees: string;
  expiredHeight: number | null;
  tokenDecimals?: number;
  tokenSymbol: string;
}

async function formatOutput(
  swap: SwapDetails & { contract: { address: string; name: string } }
) {
  const stxAmount = (swap.ustx / 1_000_000).toFixed(6);
  const tokenDecimals = swap.tokenDecimals ?? 6; // Default to 6 if undefined
  const formattedTokenAmount = `${(
    swap.amount / Math.pow(10, tokenDecimals)
  ).toFixed(tokenDecimals)} ${swap.tokenSymbol} (${swap.amount} μ${
    swap.tokenSymbol
  })`;

  console.log("\nSwap Details:");
  console.log("=============");
  console.log(`Type: Bid`);
  console.log(`Status: ${swap.open ? "Open" : "Closed"}`);
  console.log(`\nAmounts:`);
  console.log(`- STX: ${stxAmount} STX (${swap.ustx} μSTX)`);
  console.log(`- Token: ${formattedTokenAmount}`);

  const price = swap.ustx / swap.amount;
  const adjustedPrice = (price * Math.pow(10, tokenDecimals - 6)).toFixed(8);
  console.log(`- Price per ${swap.tokenSymbol}: ${adjustedPrice} STX`);

  console.log(`\nCounterparties:`);
  console.log(`- FT Sender: ${swap.ftSender}`);
  console.log(`- STX Sender: ${swap.stxSender || "Any"}`);

  console.log(`\nContracts:`);
  console.log(`- Token: ${swap.ft}`);
  console.log(`- Bid Contract: ${swap.contract.address}.${swap.contract.name}`);
  console.log(`- Gas fee: ${10000 / 1_000_000} STX`);

  if (swap.expiredHeight) {
    console.log(`\nExpires at block: ${swap.expiredHeight}`);
  } else {
    console.log(`\nExpires: Never unless cancelled`);
  }
}

async function getBid(swapId: number) {
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
    const formattedSwap = await sdk.getBid(swapId);

    if (formattedSwap) {
      await formatOutput(
        formattedSwap as SwapDetails & {
          contract: { address: string; name: string };
        }
      );
      return formattedSwap;
    } else {
      console.error("Failed to parse swap details");
      return null;
    }
  } catch (error) {
    console.error(
      `Error fetching bid: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
    throw error;
  }
}

// Parse command line arguments
const rawSwapId = process.argv[2];

if (rawSwapId === undefined || isNaN(parseInt(rawSwapId))) {
  console.error("Usage: bun run src/jing/get-bid.ts <swap_id>");
  console.error("Example: bun run src/jing/get-bid.ts 1");
  process.exit(1);
}

const swapId = parseInt(rawSwapId);

getBid(swapId)
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
