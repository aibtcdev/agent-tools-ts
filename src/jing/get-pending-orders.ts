import { CONFIG, deriveChildAccount } from "../utilities";
import { JingCashSDK, FormattedOrder } from "@jingcash/core-sdk";

async function getPendingOrders() {
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
    const pendingOrders = await sdk.getPendingOrders();

    const asks = pendingOrders.results.filter(
      (order: FormattedOrder) => order.type === "Ask"
    );
    const bids = pendingOrders.results.filter(
      (order: FormattedOrder) => order.type === "Bid"
    );

    console.log("\nOrder Summary:");
    console.log(`Total Orders: ${pendingOrders.results.length}`);
    console.log(`Total Asks: ${asks.length}`);
    console.log(`Total Bids: ${bids.length}`);

    console.log("\nDetailed Orders:");
    pendingOrders.results.forEach((order: FormattedOrder) => {
      console.log(`\nSwap ID: ${order.id}`);
      console.log(`Type: ${order.type}`);
      console.log(`Market: ${order.market}`);

      // For Bids: STX first, then Token
      if (order.type === "Bid") {
        console.log(`${order.displayStxAmount}`);
        console.log(`${order.displayAmount}`);
      }
      // For Asks: Token first, then STX
      else {
        console.log(`${order.displayAmount}`);
        console.log(`${order.displayStxAmount}`);
      }

      console.log(`${order.displayPrice}`);
      console.log(`Status: ${order.status}`);
      if (order.processedAt) {
        console.log(
          `Processed At: ${new Date(order.processedAt).toISOString()}`
        );
      }
      if (order.txId) {
        console.log(`TX ID: ${order.txId}`);
      }
    });
  } catch (error) {
    console.log(error);
  }
}

getPendingOrders()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\nError:", error.message);
    process.exit(1);
  });
