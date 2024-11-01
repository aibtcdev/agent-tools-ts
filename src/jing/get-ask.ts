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
  amount: number;
  ftSender: string;
  stxSender: string | null;
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
    amount: parseInt(value.amount.value),
    ftSender: value["ft-sender"].value,
    stxSender: value["stx-sender"].value,
    open: value.open.value,
    ft: value.ft.value,
    fees: value.fees.value,
    expiredHeight: value["expired-height"].value,
  };
}

async function formatOutput(swap: SwapDetails) {
  const tokenSymbol = getTokenSymbol(swap.ft);

  // Get token decimals
  const tokenInfo = getTokenInfo(`${tokenSymbol}-STX`);
  if (tokenInfo) {
    try {
      swap.tokenDecimals = await getTokenDecimals(tokenInfo);
    } catch (error: unknown) {
      console.warn(
        `Warning: Could not get token decimals: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      swap.tokenDecimals = undefined;
    }
  }

  const stxAmount = (swap.ustx / 1_000_000).toFixed(6);
  const formattedTokenAmount =
    swap.tokenDecimals !== undefined
      ? `${(swap.amount / Math.pow(10, swap.tokenDecimals)).toFixed(
          swap.tokenDecimals
        )} ${tokenSymbol} (${swap.amount} μ${tokenSymbol})`
      : `${swap.amount} μ${tokenSymbol}`;

  console.log("\nSwap Details:");
  console.log("=============");
  console.log(`Type: Ask`);
  console.log(`Status: ${swap.open ? "Open" : "Closed"}`);

  console.log(`\nAmounts:`);
  console.log(`- Token: ${formattedTokenAmount}`);
  console.log(`- STX: ${stxAmount} STX (${swap.ustx} μSTX)`);

  if (swap.tokenDecimals !== undefined) {
    console.log(`- Token Decimals: ${swap.tokenDecimals}`);
  }

  // Calculate and display price
  const price = swap.ustx / swap.amount;
  const adjustedPrice =
    swap.tokenDecimals !== undefined
      ? (price * Math.pow(10, swap.tokenDecimals - 6)).toFixed(8)
      : (price / 1_000_000).toFixed(8);
  console.log(`- Price per ${tokenSymbol}: ${adjustedPrice} STX`);

  console.log(`\nCounterparties:`);
  console.log(`- FT Sender: ${swap.ftSender}`);
  console.log(`- STX Sender: ${swap.stxSender || "Any"}`);

  console.log(`\nContracts:`);
  console.log(`- Token: ${swap.ft}`);
  console.log(
    `- Ask Contract: ${JING_CONTRACTS.ASK.address}.${JING_CONTRACTS.ASK.name}`
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
      contractAddress: JING_CONTRACTS.ASK.address,
      contractName: JING_CONTRACTS.ASK.name,
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
  console.error("\nUsage:");
  console.error("bun run src/jing/get-ask.ts <swap_id>");
  console.error("\nParameters:");
  console.error("- swap_id: ID of the ask to query");
  console.error("\nExample:");
  console.error("bun run src/jing/get-ask.ts 1");
  console.error("");
  process.exit(1);
}

const swapId = parseInt(rawSwapId);

getSwap(swapId)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(
      "\nError:",
      error instanceof Error ? error.message : "Unknown error"
    );
    process.exit(1);
  });
