#!/usr/bin/env bun

import { CONFIG, deriveChildAccount } from "../utilities";
import { JingCashSDK } from "@jingcash/core-sdk";

async function createBidOffer(
  pair: string,
  stxAmount: number,
  tokenAmount: number,
  recipient?: string,
  expiry?: number,
  accountIndex: number = 0
) {
  const { address } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    accountIndex
  );

  console.log(
    `Preparing bid offer from account index ${accountIndex} (${address})`
  );

  const sdk = new JingCashSDK({
    API_HOST:
      process.env.JING_API_URL || "https://backend-neon-ecru.vercel.app/api",
    API_KEY: process.env.JING_API_KEY || "dev-api-token",
    defaultAddress: address,
    network: CONFIG.NETWORK,
  });

  try {
    const tokenSymbol = pair.split("-")[0];
    const response = await sdk.createBidOffer({
      pair,
      stxAmount,
      tokenAmount,
      gasFee: 10000,
      recipient,
      expiry,
      accountIndex,
      mnemonic: CONFIG.MNEMONIC,
    });

    console.log("\nBid details:");
    console.log(`- Pair: ${pair}`);
    console.log(
      `- STX amount: ${stxAmount} STX (${stxAmount * 1_000_000} μSTX)`
    );
    console.log(
      `- ${tokenSymbol} amount: ${tokenAmount} ${tokenSymbol} (${response.details.tokenAmount} μ${tokenSymbol})`
    );
    if (recipient) console.log(`- Private offer to: ${recipient}`);
    if (expiry) console.log(`- Expires in: ${expiry} blocks`);
    if (accountIndex !== 0)
      console.log(`- Using account index: ${accountIndex}`);
    console.log(`- Fee: ${response.details.fees} STX`);
    console.log(`- Gas fee: ${response.details.gasFee} STX`);

    console.log("\nTransaction broadcast successfully!");
    console.log("Transaction ID:", response.txid);
    console.log(
      `Bid offer initiated. Monitor status at: https://explorer.stacks.co/txid/${response.txid}`
    );

    return response;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Error creating bid offer: ${error.message}`);
    } else {
      console.error("An unknown error occurred while creating bid offer");
    }
    throw error;
  }
}

// Parse command line arguments
const [pair, stxAmount, tokenAmount, recipient, expiry, accountIndex] =
  process.argv.slice(2);

if (!pair || !stxAmount || !tokenAmount) {
  console.error("\nUsage:");
  console.error(
    "bun run src/jing/bid.ts <pair> <stx_amount> <token_amount> [recipient] [expiry] [account_index]"
  );
  console.error("\nParameters:");
  console.error("- pair: Trading pair (e.g., PEPE-STX)");
  console.error("- stx_amount: Amount of STX (e.g., 1 for 1 STX)");
  console.error("- token_amount: Amount of tokens (e.g., 100 for 100 PEPE)");
  console.error(
    "- recipient: (Optional) Make private offer to specific address"
  );
  console.error("- expiry: (Optional) Number of blocks until expiration");
  console.error(
    "- account_index: (Optional) Account index to use, defaults to 0"
  );
  console.error("\nExamples:");
  console.error("1. Public bid:");
  console.error("   bun run src/jing/bid.ts PEPE-STX 1 100000");
  console.error("\n2. Private bid to specific address with 1000 block expiry:");
  console.error(
    "   bun run src/jing/bid.ts PEPE-STX 1 100 SP2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2T0Z55KS 1000"
  );
  process.exit(1);
}

createBidOffer(
  pair,
  parseFloat(stxAmount),
  parseFloat(tokenAmount),
  recipient,
  expiry ? parseInt(expiry) : undefined,
  accountIndex ? parseInt(accountIndex) : 0
)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\nError:", error.message);
    process.exit(1);
  });
