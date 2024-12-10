import { CONFIG, deriveChildAccount } from "../utilities";
import { JingCashSDK } from "@jingcash/core-sdk";

function formatNumber(num: number, decimals: number): string {
  if (num < 0.00001) {
    return num.toExponential(4);
  }
  return num.toFixed(decimals);
}

function getDisplayDecimals(tokenDecimals: number): {
  priceDecimals: number;
  amountDecimals: number;
} {
  if (tokenDecimals >= 8) {
    return { priceDecimals: 8, amountDecimals: 4 };
  } else if (tokenDecimals >= 6) {
    return { priceDecimals: 6, amountDecimals: 4 };
  } else {
    return { priceDecimals: 6, amountDecimals: 2 };
  }
}

async function getPrivateOffers(pair: string, userAddress: string) {
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
    const privateOffers = await sdk.getPrivateOffers(pair, userAddress);
    const [baseToken] = pair.split("-");

    // Get decimals from first offer or default to 6
    const tokenDecimals =
      privateOffers.privateAsks[0]?.in_decimals ||
      privateOffers.privateBids[0]?.out_decimals ||
      6;

    const { priceDecimals, amountDecimals } = getDisplayDecimals(tokenDecimals);

    console.log(`\n=== Private Offers for ${baseToken}/STX ===`);
    console.log(`For User: ${userAddress}`);

    // Format and display opportunities to buy
    console.log("\n=== You Can Buy ===");
    if (privateOffers.privateAsks.length === 0) {
      console.log("No offers to buy available");
    } else {
      console.log(
        "Ask ID    | Price (STX)      | Amount            | Total (STX)    | From"
      );
      console.log(
        "------------------------------------------------------------------------"
      );
      privateOffers.privateAsks.forEach((ask) => {
        const price =
          ask.ustx /
          Math.pow(10, 6) /
          (ask.amount / Math.pow(10, ask.in_decimals));
        const amount = ask.amount / Math.pow(10, ask.in_decimals);
        const total = ask.ustx / Math.pow(10, 6);
        const maker = ask.ftSenderBns || ask.ftSender;

        console.log(
          `${ask.id.toString().padStart(4)} | ` +
            `${formatNumber(price, priceDecimals).padStart(15)} | ` +
            `${formatNumber(amount, amountDecimals).padStart(16)} | ` +
            `${formatNumber(total, 2).padStart(13)} | ` +
            `${maker.slice(0, 12).padEnd(14)}`
        );
      });
    }

    // Format and display opportunities to sell
    console.log("\n=== You Can Sell ===");
    if (privateOffers.privateBids.length === 0) {
      console.log("No offers to sell available");
    } else {
      console.log(
        "Bid ID    | Price (STX)      | Amount            | Total (STX)    | To"
      );
      console.log(
        "------------------------------------------------------------------------"
      );
      privateOffers.privateBids.forEach((bid) => {
        const price =
          bid.ustx /
          Math.pow(10, 6) /
          (bid.amount / Math.pow(10, bid.out_decimals));
        const amount = bid.amount / Math.pow(10, bid.out_decimals);
        const total = bid.ustx / Math.pow(10, 6);
        const taker = bid.stxSenderBns || bid.stxSender;

        console.log(
          `${bid.id.toString().padStart(4)} | ` +
            `${formatNumber(price, priceDecimals).padStart(15)} | ` +
            `${formatNumber(amount, amountDecimals).padStart(16)} | ` +
            `${formatNumber(total, 2).padStart(13)} | ` +
            `${taker.slice(0, 12).padEnd(14)}`
        );
      });
    }

    // Trading instructions
    console.log("\n=== How to Trade ===");
    console.log(`To buy ${baseToken}: bun run src/jing/submit-ask.ts <askId>`);
    console.log(`To sell ${baseToken}: bun run src/jing/submit-bid.ts <bidId>`);
    console.log("Use the ID from the offer you want to accept");
  } catch (error) {
    console.error("Error:", error);
  }
}

// Parse command line arguments
const [pair, userAddress] = process.argv.slice(2);

if (!pair || !userAddress) {
  console.log("Usage: bun get-private-offers <pair> <userAddress>");
  console.log(
    "Example: bun src/jing/get-private-offers.ts PEPE-STX SP29D6YMDNAKN1P045T6Z817RTE1AC0JAA99WAX2B"
  );
  process.exit(1);
}

getPrivateOffers(pair, userAddress)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\nError:", error.message);
    process.exit(1);
  });
