import { CONFIG, deriveChildAccount } from "../utilities";
import { JingCashSDK } from "@jingcash/core-sdk";

async function createAskOffer(
  pair: string,
  tokenAmount: number,
  stxAmount: number,
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
    `Preparing ask offer from account index ${accountIndex} (${address})`
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
    const response = await sdk.createAskOffer({
      pair,
      tokenAmount,
      stxAmount,
      gasFee: 10000,
      recipient,
      expiry,
      accountIndex,
      mnemonic: CONFIG.MNEMONIC,
    });

    // Calculate and display the effective price
    const price = response.details.ustx / response.details.microTokenAmount;
    const adjustedPrice =
      price * Math.pow(10, response.details.tokenDecimals - 6);

    console.log("\nAsk details:");
    console.log(`- Pair: ${pair}`);
    console.log(`- Token decimals: ${response.details.tokenDecimals}`);
    console.log(
      `- ${tokenSymbol} amount: ${tokenAmount} ${tokenSymbol} (${response.details.microTokenAmount} μ${tokenSymbol})`
    );
    console.log(
      `- STX price: ${stxAmount} STX (${response.details.ustx} μSTX)`
    );
    if (recipient) console.log(`- Private offer to: ${recipient}`);
    if (expiry) console.log(`- Expires in: ${expiry} blocks`);
    if (accountIndex !== 0)
      console.log(`- Using account index: ${accountIndex}`);
    console.log(
      `- Fee: ${response.details.fees} ${tokenSymbol} (${
        response.details.fees * Math.pow(10, response.details.tokenDecimals)
      } μ${tokenSymbol})`
    );
    console.log(`- Gas fee: ${response.details.gasFee} STX`);
    console.log(`- Price per ${tokenSymbol}: ${adjustedPrice.toFixed(8)} STX`);

    console.log("\nTransaction broadcast successfully!");
    console.log("Transaction ID:", response.txid);
    console.log(
      `Ask offer initiated. Monitor status at: https://explorer.stacks.co/txid/${response.txid}`
    );

    return response;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Error creating ask offer: ${error.message}`);
    } else {
      console.error("An unknown error occurred while creating ask offer");
    }
    throw error;
  }
}

// Parse command line arguments
const [pair, tokenAmount, stxAmount, recipient, expiry, accountIndex] =
  process.argv.slice(2);

if (!pair || !tokenAmount || !stxAmount) {
  console.error("\nUsage:");
  console.error(
    "bun run src/jing/ask.ts <pair> <token_amount> <stx_amount> [recipient] [expiry] [account_index]"
  );
  console.error("\nParameters:");
  console.error("- pair: Trading pair (e.g., PEPE-STX)");
  console.error(
    "- token_amount: Amount of tokens to sell (e.g., 100 for 100 PEPE)"
  );
  console.error(
    "- stx_amount: Amount of STX to receive (e.g., 1.5 for 1.5 STX)"
  );
  console.error(
    "- recipient: (Optional) Make private offer to specific address"
  );
  console.error("- expiry: (Optional) Number of blocks until expiration");
  console.error(
    "- account_index: (Optional) Account index to use, defaults to 0"
  );
  console.error("\nExamples:");
  console.error("1. Public ask:");
  console.error("   bun run src/jing/ask.ts PEPE-STX 100000 1.5");
  console.error("\n2. Private ask to specific address with 1000 block expiry:");
  console.error(
    "   bun run src/jing/ask.ts PEPE-STX 100000 1.5 SP29D6YMDNAKN1P045T6Z817RTE1AC0JAA99WAX2B 1000"
  );
  process.exit(1);
}

createAskOffer(
  pair,
  parseFloat(tokenAmount),
  parseFloat(stxAmount),
  recipient,
  expiry ? parseInt(expiry) : undefined,
  accountIndex ? parseInt(accountIndex) : 0
)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\nError:", error.message);
    process.exit(1);
  });
