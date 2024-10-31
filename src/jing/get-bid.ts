// src/jing/get-bid.ts

import { callReadOnlyFunction, cvToJSON, uintCV } from "@stacks/transactions";
import { CONFIG, getNetwork, deriveChildAccount } from "../utilities";
import { JING_CONTRACTS, getTokenSymbol } from "./utils-token-pairs";

interface SwapDetails {
  ustx: number;
  stxSender: string;
  amount: number;
  ftSender: string | null;
  open: boolean;
  ft: string;
  fees: string;
  expiredHeight: number | null;
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

function formatOutput(swap: SwapDetails) {
  const stxAmount = (swap.ustx / 1_000_000).toFixed(6);
  const tokenSymbol = getTokenSymbol(swap.ft);

  console.log("\nSwap Details:");
  console.log("=============");
  console.log(`Type: Bid`);
  console.log(`Status: ${swap.open ? "Open" : "Closed"}`);
  console.log(`\nAmounts:`);
  console.log(`- ${stxAmount} STX (${swap.ustx} μSTX)`);
  console.log(`- ${swap.amount} ${tokenSymbol} (in μ units)`);
  console.log(`\nCounterparties:`);
  console.log(`- STX Sender: ${swap.stxSender}`);
  console.log(`- FT Sender: ${swap.ftSender || "Any"}`);
  console.log(`\nContracts:`);
  console.log(`- Token: ${swap.ft}`);
  console.log(
    `- Bid Contract: ${JING_CONTRACTS.BID.address}.${JING_CONTRACTS.BID.name}`
  );

  if (swap.expiredHeight) {
    console.log(`\nExpires at block: ${swap.expiredHeight}`);
  } else {
    console.log(`\nExpires:`);
    console.log(`- Never unless cancelled`);
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
      formatOutput(formattedSwap);
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
