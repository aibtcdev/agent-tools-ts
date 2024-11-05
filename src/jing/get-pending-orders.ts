import {
  JingCashSDK,
  FormattedOrder,
  DisplayOrder,
  DisplayBid,
} from "@jingcash/core-sdk";

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
      console.log(`Processed At: ${new Date(order.processedAt).toISOString()}`);
    }
    if (order.txId) {
      console.log(`TX ID: ${order.txId}`);
    }
  });
} catch (error) {
  console.log(error);
}
