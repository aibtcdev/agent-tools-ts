import { Inscription } from "ordinalsbot";
import dotenv from "dotenv";

dotenv.config();

// Get command line arguments with defaults
const runeName = process.argv[2];
const supply = Number(process.argv[3]);
const runeSymbol = process.argv[4];
const network = (process.argv[5] || "testnet") as "testnet" | "mainnet";

// Validate required parameters
if (!runeName || !supply || !runeSymbol) {
  console.error("\nPlease provide all required parameters:");
  console.error(
    "ts-node etch-runes.ts <rune_name> <supply> <symbol> [network]"
  );
  console.error("\nExample:");
  console.error('ts-node etch-runes.ts "FAKTORY•TOKEN" 21000000 "K" testnet');
  console.error("\nParameters:");
  console.error("  rune_name: Name of the rune (e.g., FAKTORY•TOKEN)");
  console.error("  supply: Total supply of tokens (e.g., 21000000)");
  console.error("  symbol: Single character symbol (e.g., K)");
  console.error("  network: (optional) testnet or mainnet (default: testnet)");
  process.exit(1);
}

// Load environment variables
const API_KEY = process.env.ORDINALSBOT_API_KEY;
const RECEIVE_ADDRESS = process.env.RECEIVE_ADDRESS;

if (!API_KEY) {
  throw new Error("ORDINALSBOT_API_KEY environment variable is required");
}

if (!RECEIVE_ADDRESS) {
  throw new Error("RECEIVE_ADDRESS environment variable is required");
}

// Standard file requirement for rune etching
const standardFile = {
  name: "rune.txt",
  size: 1,
  type: "plain/text",
  dataURL: "data:plain/text;base64,YQ==", // "a" in base64
};

// Initialize the Inscription client
const inscription = new Inscription(API_KEY, network);

async function etchRunesToken() {
  try {
    // Log configuration
    console.log("\nRune Configuration:");
    console.log("------------------");
    console.log("Network:", network);
    console.log("Rune Name:", runeName);
    console.log("Supply:", supply.toLocaleString());
    console.log("Symbol:", runeSymbol);
    console.log("Receive Address:", RECEIVE_ADDRESS);
    console.log("------------------\n");

    // Prompt for confirmation
    console.log("Creating runes etching order...");

    const runesEtchOrder = {
      files: [standardFile],
      turbo: true,
      rune: runeName,
      supply: supply,
      symbol: runeSymbol,
      divisibility: 8,
      premine: supply, // 100% premine
      fee: 510,
      receiveAddress: RECEIVE_ADDRESS!,
    };

    const response = await inscription.createRunesEtchOrder(runesEtchOrder);

    console.log("\nOrder created successfully!");
    console.log("------------------");
    console.log(JSON.stringify(response, null, 2));

    if (response && typeof response === "object" && "id" in response) {
      console.log(`\nTracking order status for ID: ${response.id}`);
      const orderStatus = await inscription.getOrder(response.id);
      console.log("\nCurrent order status:", orderStatus);
    }
  } catch (error) {
    console.error("\nError creating runes etching order:");
    if (error instanceof Error) {
      console.error("Message:", error.message);
      if (typeof error === "object" && error !== null && "status" in error) {
        console.error("Status:", (error as { status: unknown }).status);
      }
    } else {
      console.error("Unknown error:", error);
    }
    throw error;
  }
}

// Execute with error handling
etchRunesToken().catch((error) => {
  console.error("\nFatal error:", error);
  process.exit(1);
});
