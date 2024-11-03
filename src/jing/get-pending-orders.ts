import { JingCashSDK } from "@jingcash/core-sdk";

if (!process.env.JING_API_URL || !process.env.JING_API_KEY) {
  console.log("Please set JING_API_URL and JING_API_KEY in your .env file");
  process.exit(1);
}

const sdk = new JingCashSDK({
  API_HOST: process.env.JING_API_URL,
  API_KEY: process.env.JING_API_KEY,
});

try {
  const pendingOrders = await sdk.getPendingOrders();

  // Process and display the results
  console.log("\nPending Orders Summary:");
  console.log(`Total Pending Orders: ${pendingOrders.results.length}`);

  // Detailed orders
  console.log("\nDetailed Orders:");
  pendingOrders.results.forEach((order) => {
    const type = "ftSender" in order ? "Ask" : "Bid";
    const amount = order.amount;
    const ustx = order.ustx;
    const price = ustx / amount;
    const status = order.status;
    const processedAt = new Date(order.processedAt || 0).toISOString();

    console.log(`
    Type: ${type}
    Amount: ${amount} (μTokens)
    Price: ${price} μSTX/Token
    Status: ${status}
    Processed At: ${processedAt}
    TX ID: ${order.txId || "N/A"}
    `);
  });
} catch (error) {
  console.log(error);
}
