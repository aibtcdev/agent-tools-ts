import { callReadOnlyFunction, cvToJSON, uintCV } from "@stacks/transactions";
import { CONFIG, getNetwork, deriveChildAccount } from "../utilities";
import {
  JING_CONTRACTS,
  getTokenSymbol,
  getTokenInfo,
  getTokenDecimals,
} from "./utils-token-pairs";

interface SwapDetails {
  ustx: number;
  stxSender: string;
  amount: number;
  ftSender: string | null;
  open: boolean;
  ft: string;
  fees: string;
  expiredHeight: number | null;
  tokenDecimals?: number;
}

function formatSwapResponse(rawResponse: any): SwapDetails | null {
  if (!rawResponse.success) return null;

  const value = rawResponse.value.value;

  return {
    ustx: parseInt(value.ustx.value),
    stxSender: value["stx-sender"].value,
    amount: parseInt(value.amount.value),
    ftSender: value["ft-sender"].value,
    open: value.open.value,
    ft: value.ft.value,
    fees: value.fees.value,
    expiredHeight: value["expired-height"].value,
  };
}

async function formatOutput(swap: SwapDetails) {
  const stxAmount = (swap.ustx / 1_000_000).toFixed(6);
  const tokenSymbol = getTokenSymbol(swap.ft);

  // Get token decimals
  const tokenInfo = getTokenInfo(`${tokenSymbol}-STX`);
  if (tokenInfo) {
    try {
      swap.tokenDecimals = await getTokenDecimals(tokenInfo);
    } catch (error) {
      console.warn(
        `Warning: Could not get token decimals: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      swap.tokenDecimals = undefined;
    }
  }

  // Format token amount with decimals if available
  const formattedTokenAmount =
    swap.tokenDecimals !== undefined
      ? `${(swap.amount / Math.pow(10, swap.tokenDecimals)).toFixed(
          swap.tokenDecimals
        )} ${tokenSymbol} (${swap.amount} μ${tokenSymbol})`
      : `${swap.amount} μ${tokenSymbol}`;

  console.log("\nSwap Details:");
  console.log("=============");
  console.log(`Type: Bid`);
  console.log(`Status: ${swap.open ? "Open" : "Closed"}`);

  console.log(`\nAmounts:`);
  console.log(`- STX: ${stxAmount} STX (${swap.ustx} μSTX)`);
  console.log(`- Token: ${formattedTokenAmount}`);

  if (swap.tokenDecimals !== undefined) {
    console.log(`- Token Decimals: ${swap.tokenDecimals}`);
  }

  const price = swap.ustx / swap.amount;
  const formattedPrice =
    swap.tokenDecimals !== undefined
      ? (price / Math.pow(10, 6 - swap.tokenDecimals)).toFixed(8)
      : (price / 1_000_000).toFixed(8);
  console.log(`- Price per token: ${formattedPrice} STX`);

  console.log(`\nCounterparties:`);
  console.log(`- STX Sender: ${swap.stxSender}`);
  console.log(`- FT Sender: ${swap.ftSender || "Any"}`);

  console.log(`\nContracts:`);
  console.log(`- Token: ${swap.ft}`);
  console.log(
    `- Bid Contract: ${JING_CONTRACTS.BID.address}.${JING_CONTRACTS.BID.name}`
  );
  console.log(`- Gas fee: ${10000 / 1_000_000} STX`);

  if (swap.expiredHeight) {
    console.log(`\nExpires at block: ${swap.expiredHeight}`);
  } else {
    console.log(`\nExpires: Never unless cancelled`);
  }
}

async function getSwap(swapId: number) {
  const network = getNetwork(CONFIG.NETWORK);
  const { address } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );

  try {
    const result = await callReadOnlyFunction({
      contractAddress: JING_CONTRACTS.BID.address,
      contractName: JING_CONTRACTS.BID.name,
      functionName: "get-swap",
      functionArgs: [uintCV(swapId)],
      network,
      senderAddress: address,
    });

    const jsonResult = cvToJSON(result);
    const formattedSwap = formatSwapResponse(jsonResult);

    if (formattedSwap) {
      await formatOutput(formattedSwap);
      return formattedSwap;
    } else {
      console.error("Failed to parse swap details");
      return null;
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Error fetching swap: ${error.message}`);
    } else {
      console.error("An unknown error occurred while fetching swap");
    }
    throw error;
  }
}

// Parse command line arguments
const rawSwapId = process.argv[2];

if (rawSwapId === undefined || isNaN(parseInt(rawSwapId))) {
  console.error("Usage: bun run src/jing/get-bid.ts <swap_id>");
  console.error("Example: bun run src/jing/get-bid.ts 1");
  process.exit(1);
}

const swapId = parseInt(rawSwapId);

getSwap(swapId)
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
