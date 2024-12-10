import { CONFIG, deriveChildAccount } from "../utilities";
import { JingCashSDK } from "@jingcash/core-sdk";

interface FormattedOrder {
  id: number;
  price: number;
  amount: number;
  total: number;
  maker: string;
  decimals: number;
}

function formatNumber(num: number, decimals: number): string {
  // For very small numbers, use scientific notation
  if (num < 0.00001) {
    return num.toExponential(4);
  }
  return num.toFixed(decimals);
}

function getDisplayDecimals(tokenDecimals: number): {
  priceDecimals: number;
  amountDecimals: number;
} {
  // For tokens with high decimal places (like aBTC), show fewer decimals in display
  if (tokenDecimals >= 8) {
    return {
      priceDecimals: 8, // Show 8 decimals for price
      amountDecimals: 4, // Show 4 decimals for amount
    };
  } else if (tokenDecimals >= 6) {
    return {
      priceDecimals: 6,
      amountDecimals: 4,
    };
  } else {
    return {
      priceDecimals: 6,
      amountDecimals: 2,
    };
  }
}

async function getFormattedMarket(pair: string) {
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
    const [baseToken] = pair.split("_");

    // Get decimals from first order or default to 6
    const tokenDecimals =
      orderBook.asks[0]?.in_decimals || orderBook.bids[0]?.out_decimals || 6;

    const { priceDecimals, amountDecimals } = getDisplayDecimals(tokenDecimals);

    // Format bids
    const formattedBids = orderBook.bids
      .map((bid) => ({
        id: bid.id,
        price:
          bid.ustx /
          Math.pow(10, 6) /
          (bid.amount / Math.pow(10, bid.out_decimals)),
        amount: bid.amount / Math.pow(10, bid.out_decimals),
        total: bid.ustx / Math.pow(10, 6),
        maker: bid.stxSenderBns || bid.stxSender,
        decimals: bid.out_decimals,
      }))
      .sort((a, b) => b.price - a.price);

    // Format asks
    const formattedAsks = orderBook.asks
      .map((ask) => ({
        id: ask.id,
        price:
          ask.ustx /
          Math.pow(10, 6) /
          (ask.amount / Math.pow(10, ask.in_decimals)),
        amount: ask.amount / Math.pow(10, ask.in_decimals),
        total: ask.ustx / Math.pow(10, 6),
        maker: ask.ftSenderBns || ask.ftSender,
        decimals: ask.in_decimals,
      }))
      .sort((a, b) => a.price - b.price);

    // Calculate market statistics
    const bestBid = formattedBids[0];
    const bestAsk = formattedAsks[0];
    const spread = bestAsk && bestBid ? bestAsk.price - bestBid.price : null;
    const spreadPercentage =
      bestAsk && bestBid
        ? ((bestAsk.price - bestBid.price) / bestBid.price) * 100
        : null;

    console.log(`\n=== ${baseToken}/STX Market ===`);
    console.log(`Token Decimals: ${tokenDecimals}`);

    console.log("\n=== ASKS (Sell Orders) ===");
    console.log(
      "ID    | Price (STX)      | Amount            | Total (STX)    | Maker"
    );
    console.log(
      "------------------------------------------------------------------------"
    );
    formattedAsks.forEach((ask) => {
      console.log(
        `${ask.id.toString().padStart(4)} | ` +
          `${formatNumber(ask.price, priceDecimals).padStart(15)} | ` +
          `${formatNumber(ask.amount, amountDecimals).padStart(16)} | ` +
          `${formatNumber(ask.total, 2).padStart(13)} | ` +
          `${ask.maker}`
      );
    });

    if (spread !== null && spreadPercentage !== null) {
      console.log("\n" + "-".repeat(71));
      console.log(
        `Spread: ${formatNumber(spread, priceDecimals)} STX (${formatNumber(
          spreadPercentage,
          2
        )}%)`
      );
      console.log("-".repeat(71));
    }

    console.log("\n=== BIDS (Buy Orders) ===");
    console.log(
      "ID    | Price (STX)      | Amount            | Total (STX)    | Maker"
    );
    console.log(
      "------------------------------------------------------------------------"
    );
    formattedBids.forEach((bid) => {
      console.log(
        `${bid.id.toString().padStart(4)} | ` +
          `${formatNumber(bid.price, priceDecimals).padStart(15)} | ` +
          `${formatNumber(bid.amount, amountDecimals).padStart(16)} | ` +
          `${formatNumber(bid.total, 2).padStart(13)} | ` +
          `${bid.maker}`
      );
    });

    console.log("\n=== Market Summary ===");
    const bidVolume = formattedBids.reduce((sum, bid) => sum + bid.amount, 0);
    const askVolume = formattedAsks.reduce((sum, ask) => sum + ask.amount, 0);
    console.log(
      `Best Bid: ${
        bestBid
          ? `ID ${bestBid.id} at ${formatNumber(
              bestBid.price,
              priceDecimals
            )} STX`
          : "None"
      }`
    );
    console.log(
      `Best Ask: ${
        bestAsk
          ? `ID ${bestAsk.id} at ${formatNumber(
              bestAsk.price,
              priceDecimals
            )} STX`
          : "None"
      }`
    );
    console.log(
      `\nTotal Bid Volume: ${formatNumber(
        bidVolume,
        amountDecimals
      )} ${baseToken}`
    );
    console.log(
      `Total Ask Volume: ${formatNumber(
        askVolume,
        amountDecimals
      )} ${baseToken}`
    );

    // Usage instructions
    console.log("\n=== How to Trade ===");
    console.log(
      "To take a bid (sell PEPE): bun run src/jing/submit-bid.ts <bid_id>"
    );
    console.log(
      "To take an ask (buy PEPE): bun run src/jing/submit-ask.ts <ask_id>"
    );
    console.log("Use the ID from the order you want to take.");

    return {
      bids: formattedBids,
      asks: formattedAsks,
      summary: {
        bestBid: bestBid ? { id: bestBid.id, price: bestBid.price } : null,
        bestAsk: bestAsk ? { id: bestAsk.id, price: bestAsk.price } : null,
        spread,
        spreadPercentage,
        bidVolume,
        askVolume,
        tokenDecimals,
      },
    };
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

// Parse command line arguments
const pair = process.argv[2];

if (!pair) {
  console.log("Please provide a token pair as argument (e.g., aBTC_STX)");
  process.exit(1);
}

getFormattedMarket(pair)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\nError:", error.message);
    process.exit(1);
  });
