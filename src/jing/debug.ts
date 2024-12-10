import { CONFIG, deriveChildAccount } from "../utilities";
import { JingCashSDK } from "@jingcash/core-sdk";

interface ApiResponse<T> {
  count: number;
  next: string | null;
  results: T[];
}

interface StacksBid {
  id: number;
  out_contract: string;
  amount: number;
  out_decimals: number;
  ftSender: string | null;
  in_contract: string;
  ustx: number;
  in_decimals: number;
  stxSender: string;
  fees: string;
  open: boolean;
  when: number;
  status: string;
  txId: string | null;
  processedAt: string;
  expiredHeight: number | null;
  ftSenderBns: string | null;
  stxSenderBns: string | null;
}

interface StxAsk {
  id: number;
  in_contract: string;
  amount: number;
  in_decimals: number;
  ftSender: string;
  out_contract: string;
  ustx: number;
  out_decimals: number;
  stxSender: string | null;
  fees: string;
  open: boolean;
  when: number;
  status: string;
  txId: string | null;
  processedAt: string;
  expiredHeight: number | null;
  ftSenderBns: string | null;
  stxSenderBns: string | null;
}

async function debugBackendFiltering(pair: string) {
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
    // Step 1: Make direct API calls to see raw responses
    console.log("\nSTEP 1: Direct API endpoint responses");
    const PEPE_CONTRACT =
      "SP1Z92MPDQEWZXW36VX71Q25HKF5K2EPCJ304F275.tokensoft-token-v4k68639zxz";

    // Make raw fetch calls to see exactly what the backend receives
    const bidResponse = await fetch(
      `${sdk["API_HOST"]}/token-pairs/${pair}/stx-bids?ftContract=${PEPE_CONTRACT}`,
      {
        headers: {
          Authorization: `Bearer ${sdk["API_KEY"]}`,
          "X-API-Key": sdk["API_KEY"],
        },
      }
    );
    const bidsData = (await bidResponse.json()) as ApiResponse<StacksBid>;

    const askResponse = await fetch(
      `${sdk["API_HOST"]}/token-pairs/${pair}/stx-asks?ftContract=${PEPE_CONTRACT}`,
      {
        headers: {
          Authorization: `Bearer ${sdk["API_KEY"]}`,
          "X-API-Key": sdk["API_KEY"],
        },
      }
    );
    const asksData = (await askResponse.json()) as ApiResponse<StxAsk>;

    console.log(
      "\nBids endpoint URL:",
      `${sdk["API_HOST"]}/token-pairs/${pair}/stx-bids?ftContract=${PEPE_CONTRACT}`
    );
    console.log("Raw bids response status:", bidResponse.status);
    console.log("Number of bids returned:", bidsData.results.length);
    if (bidsData.results.length > 0) {
      console.log("Sample bid contract:", bidsData.results[0].out_contract);
    }

    console.log(
      "\nAsks endpoint URL:",
      `${sdk["API_HOST"]}/token-pairs/${pair}/stx-asks?ftContract=${PEPE_CONTRACT}`
    );
    console.log("Raw asks response status:", askResponse.status);
    console.log("Number of asks returned:", asksData.results.length);
    if (asksData.results.length > 0) {
      console.log("Sample ask contract:", asksData.results[0].in_contract);
    }

    // Step 2: Get and analyze SDK response
    console.log("\nSTEP 2: SDK getOrderBook response");
    const orderBook = await sdk.getOrderBook(pair);

    console.log("\nUnfiltered counts:");
    console.log("Total bids:", orderBook.bids.length);
    console.log("Total asks:", orderBook.asks.length);

    // Step 3: Analyze contract matching
    console.log("\nSTEP 3: Contract analysis");
    console.log("Looking for contract:", PEPE_CONTRACT);

    const matchingBids = orderBook.bids.filter(
      (bid) => bid.out_contract === PEPE_CONTRACT
    );
    const matchingAsks = orderBook.asks.filter(
      (ask) => ask.in_contract === PEPE_CONTRACT
    );

    console.log("\nMatching orders:");
    console.log("Matching bids:", matchingBids.length);
    console.log("Matching asks:", matchingAsks.length);

    // Step 4: Sample data analysis
    console.log("\nSTEP 4: Sample data verification");
    if (bidsData.results.length > 0) {
      console.log("\nAPI Direct Bid Sample:");
      console.log("Contract:", bidsData.results[0].out_contract);
      console.log("Status:", bidsData.results[0].status);
      console.log("Open:", bidsData.results[0].open);
    }

    if (asksData.results.length > 0) {
      console.log("\nAPI Direct Ask Sample:");
      console.log("Contract:", asksData.results[0].in_contract);
      console.log("Status:", asksData.results[0].status);
      console.log("Open:", asksData.results[0].open);
    }

    return {
      rawBids: bidsData,
      rawAsks: asksData,
      sdkOrderBook: orderBook,
      matchingOrders: {
        bids: matchingBids,
        asks: matchingAsks,
      },
    };
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

const pair = process.argv[2];
if (!pair) {
  console.log("Please provide a token pair as argument (e.g., PEPE-STX)");
  process.exit(1);
}

debugBackendFiltering(pair)
  .then((result) => {
    // Log filtered results
    console.log(
      "\nPEPE Bids:",
      result.rawBids.results
        .filter(
          (bid) =>
            bid.out_contract ===
            "SP1Z92MPDQEWZXW36VX71Q25HKF5K2EPCJ304F275.tokensoft-token-v4k68639zxz"
        )
        .map((bid) => ({
          amount: bid.amount,
          ustx: bid.ustx,
          price: bid.ustx / bid.amount,
        }))
    );

    console.log(
      "\nPEPE Asks:",
      result.rawAsks.results
        .filter(
          (ask) =>
            ask.in_contract ===
            "SP1Z92MPDQEWZXW36VX71Q25HKF5K2EPCJ304F275.tokensoft-token-v4k68639zxz"
        )
        .map((ask) => ({
          amount: ask.amount,
          ustx: ask.ustx,
          price: ask.ustx / ask.amount,
        }))
    );
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nError:", error.message);
    process.exit(1);
  });
