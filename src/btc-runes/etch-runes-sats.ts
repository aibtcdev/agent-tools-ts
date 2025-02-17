import {
  CONFIG,
  createErrorResponse,
  sendToLLM,
  ToolResponse,
} from "../utilities";
import { request, BitcoinNetworkType, RunesGetOrder } from "sats-connect"; // Import BitcoinNetworkType and RunesGetOrder

// Type definitions for the SatsConnect API
interface SatsConnectResponse<T> {
  status: "success" | "error";
  result?: T;
  error?: string;
}

// Define the RunesEstimateEtchParams type (aligned with @sats-connect/core)
interface RunesEstimateEtchParams {
  runeName: string;
  symbol?: string;
  divisibility?: number;
  premine?: string;
  isMintable: boolean;
  terms?: {
    amount: string;
    cap: string;
    heightStart?: string; // Changed from number to string
    heightEnd?: string; // Changed from number to string
    offsetStart?: string; // Changed from number to string
    offsetEnd?: string; // Changed from number to string
  };
  inscriptionDetails?: {
    contentType: string;
    contentBase64: string;
  };
  delegateInscriptionId?: string;
  turbo?: boolean;
  destinationAddress: string;
  feeRate: number;
  appServiceFee?: number;
  appServiceFeeAddress?: string;
  network?: BitcoinNetworkType;
}

// Define the RunesEtchParams type (based on documentation)
interface RunesEtchParams extends RunesEstimateEtchParams {
  refundAddress: string;
}

// Constants
const SUPPLY = 1_000_000_000;
const DIVISIBILITY = 6;
const ORDER_CHECK_INTERVAL = 10000; // 10 seconds
const MAX_ORDER_CHECK_ATTEMPTS = 36; // 6 minutes total (increased from 5)
const DEFAULT_NETWORK = "testnet";

const standardFile = {
  name: "rune.txt",
  size: 1,
  type: "plain/text",
  dataURL: "data:plain/text;base64,YQ==",
};

const usage =
  "Usage: bun run src/btc-runes/etch-runes-sats.ts <rune_name> <symbol> [network]";
const usageExample =
  'Example: bun run src/btc-runes/etch-runes-sats.ts "FAKTORY•TOKEN" "K" testnet';

// Types
interface ExpectedArgs {
  runeName: string;
  runeSymbol: string;
  network: "testnet" | "mainnet";
}

interface OrderStatus {
  status: string;
  id?: string;
  txId?: string;
  errorMessage?: string;
}

interface EtchOrderResult {
  orderId: string;
  fundTransactionId: string;
  fundingAddress: string;
}

interface OrderResponseData {
  orderId: string;
  status: string;
  runeName: string;
  runeSymbol: string;
  network: "testnet" | "mainnet";
  fundTxId: string;
  revealTxId?: string;
}

/**
 * Validates command line arguments and returns a structured object
 * @returns {ExpectedArgs} Validated arguments
 * @throws {Error} If arguments are invalid
 */
function validateArgs(): ExpectedArgs {
  const [runeName, runeSymbol, network = DEFAULT_NETWORK] =
    process.argv.slice(2);

  // Check if required arguments are present
  if (!runeName || !runeSymbol) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  // Validate rune symbol
  if (runeSymbol.length !== 1) {
    throw new Error("Symbol must be a single Unicode character");
  }

  // Validate network
  if (network !== "testnet" && network !== "mainnet") {
    throw new Error("Network must be either 'testnet' or 'mainnet'");
  }

  return {
    runeName,
    runeSymbol,
    network: network as "testnet" | "mainnet",
  };
}

/**
 * Waits for order confirmation with exponential backoff
 * @param {string} orderId Order ID to check
 * @returns {Promise<OrderStatus>} Final order status
 * @throws {Error} If order fails or times out
 */
async function waitForOrderConfirmation(orderId: string): Promise<OrderStatus> {
  let attempts = 0;
  let delay = ORDER_CHECK_INTERVAL;

  while (attempts < MAX_ORDER_CHECK_ATTEMPTS) {
    try {
      // Using Sats Connect to check order status - fix type issues using the right parameters
      const orderResponse = (await request("runes_getOrder", {
        id: orderId, // Using id as expected by the RunesGetOrder params
      })) as SatsConnectResponse<any>;

      console.log(`Order status check ${attempts + 1}:`, orderResponse.status);

      if (
        orderResponse.status === "success" &&
        orderResponse.result?.status === "completed"
      ) {
        return {
          status: "completed",
          id: orderId,
          txId: orderResponse.result?.txId,
        };
      } else if (
        orderResponse.status === "error" ||
        orderResponse.result?.status === "failed"
      ) {
        throw new Error(
          `Order failed: ${
            orderResponse.error ||
            orderResponse.result?.errorMessage ||
            "Unknown error"
          }`
        );
      }

      // Implement exponential backoff (capped at 60 seconds)
      attempts++;
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay = Math.min(delay * 1.5, 60000);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error(`Error checking order status: ${errorMessage}`);
      throw error;
    }
  }

  throw new Error(
    `Order confirmation timeout after ${MAX_ORDER_CHECK_ATTEMPTS} attempts`
  );
}

/**
 * Main function that executes the rune etching process
 * @returns {Promise<ToolResponse<string>>} Tool response
 */
async function main(): Promise<ToolResponse<string>> {
  // Validate environment variables
  const RECEIVE_ADDRESS = process.env.RECEIVE_ADDRESS;
  const REFUND_ADDRESS =
    process.env.REFUND_ADDRESS || process.env.RECEIVE_ADDRESS;

  if (!RECEIVE_ADDRESS) {
    throw new Error("RECEIVE_ADDRESS environment variable is required");
  }

  if (!REFUND_ADDRESS) {
    throw new Error("REFUND_ADDRESS is required for etching operations");
  }

  // Validate and get arguments
  const args = validateArgs();

  try {
    // First step: Estimate the cost of etching the rune
    console.log(
      `Estimating cost for etching rune "${args.runeName}" (${args.runeSymbol}) on ${args.network}...`
    );

    // Convert network string to BitcoinNetworkType
    const networkType =
      args.network === "testnet"
        ? BitcoinNetworkType.Testnet
        : BitcoinNetworkType.Mainnet;

    const estimateParams: RunesEstimateEtchParams = {
      runeName: args.runeName,
      symbol: args.runeSymbol,
      divisibility: DIVISIBILITY,
      premine: String(SUPPLY),
      isMintable: false,
      destinationAddress: RECEIVE_ADDRESS,
      feeRate: 10, // sats/vbyte, consider making this configurable
      network: networkType,
      inscriptionDetails: {
        contentType: standardFile.type,
        contentBase64: standardFile.dataURL.split(",")[1],
      },
    };

    const estimateResponse = (await request(
      "runes_estimateEtch",
      estimateParams
    )) as SatsConnectResponse<any>;

    if (estimateResponse.status !== "success" || !estimateResponse.result) {
      throw new Error(
        `Failed to estimate rune etching cost: ${
          estimateResponse.error || "Unknown error"
        }`
      );
    }

    console.log("Estimated cost breakdown:");
    console.log(`- Total cost: ${estimateResponse.result.totalCost} sats`);
    console.log(
      `- Transaction size: ${estimateResponse.result.totalSize} vbytes`
    );
    console.log(
      `- Breakdown: ${JSON.stringify(
        estimateResponse.result.costBreakdown,
        null,
        2
      )}`
    );

    // Second step: Actually etch the rune
    console.log("Initiating rune etch transaction...");
    const etchParams: RunesEtchParams = {
      ...estimateParams,
      refundAddress: REFUND_ADDRESS,
    };

    const etchResponse = (await request(
      "runes_etch",
      etchParams
    )) as SatsConnectResponse<any>;

    if (etchResponse.status !== "success" || !etchResponse.result) {
      throw new Error(
        `Failed to create rune order: ${etchResponse.error || "Unknown error"}`
      );
    }

    console.log("Etch Response:", JSON.stringify(etchResponse.result, null, 2));

    if (etchResponse.result.orderId) {
      console.log(`Order created with ID: ${etchResponse.result.orderId}`);
      console.log(
        `Funding transaction ID: ${etchResponse.result.fundTransactionId}`
      );
      console.log(`Funding address: ${etchResponse.result.fundingAddress}`);

      // Wait for order confirmation
      console.log("\nWaiting for order confirmation...");
      const finalStatus = await waitForOrderConfirmation(
        etchResponse.result.orderId
      );

      const responseData: OrderResponseData = {
        orderId: etchResponse.result.orderId,
        status: finalStatus.status,
        runeName: args.runeName,
        runeSymbol: args.runeSymbol,
        network: args.network,
        fundTxId: etchResponse.result.fundTransactionId,
        revealTxId: finalStatus.txId,
      };

      return {
        success: true,
        message: "Rune etched successfully",
        data: JSON.stringify(responseData),
      };
    }

    throw new Error("Failed to create rune order: No order ID returned");
  } catch (error) {
    console.error("Full error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: errorMessage,
      data: JSON.stringify({ error: errorMessage }),
    };
  }
}

// Execute with LLM response handling
main()
  .then(sendToLLM)
  .catch((error) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    sendToLLM({
      success: false,
      message: errorMessage,
      data: JSON.stringify({ error: errorMessage }),
    });
    process.exit(1);
  });
