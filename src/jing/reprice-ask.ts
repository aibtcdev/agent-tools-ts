import {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  uintCV,
  contractPrincipalCV,
  standardPrincipalCV,
  someCV,
  noneCV,
  callReadOnlyFunction,
  cvToJSON,
} from "@stacks/transactions";
import {
  CONFIG,
  getNetwork,
  deriveChildAccount,
  getNextNonce,
} from "../utilities";
import { getTokenInfo, JING_CONTRACTS } from "./utils-token-pairs";

interface AskDetails {
  ustx: number;
  amount: number;
  ft: string;
  ftSender: string;
}

async function getAskDetails(swapId: number): Promise<AskDetails> {
  const network = getNetwork(CONFIG.NETWORK);
  const { address } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );

  const result = await callReadOnlyFunction({
    contractAddress: JING_CONTRACTS.ASK.address,
    contractName: JING_CONTRACTS.ASK.name,
    functionName: "get-swap",
    functionArgs: [uintCV(swapId)],
    network,
    senderAddress: address,
  });

  const jsonResult = cvToJSON(result);
  if (!jsonResult.success) throw new Error("Failed to get ask details");

  return {
    ustx: parseInt(jsonResult.value.value.ustx.value),
    amount: parseInt(jsonResult.value.value.amount.value),
    ft: jsonResult.value.value.ft.value,
    ftSender: jsonResult.value.value["ft-sender"].value,
  };
}

async function repriceAsk(
  swapId: number,
  newUstx: number,
  pair: string,
  recipient?: string,
  expiry?: number,
  accountIndex: number = 0
) {
  const tokenInfo = getTokenInfo(pair);
  if (!tokenInfo) {
    throw new Error(`Failed to get token info for pair: ${pair}`);
  }

  const tokenSymbol = pair.split("-")[0]; // Get token symbol from pair (e.g., "PEPE" from "PEPE-STX")
  const network = getNetwork(CONFIG.NETWORK);
  const { address, key } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    accountIndex
  );
  const nonce = await getNextNonce(CONFIG.NETWORK, address);

  // Get current ask details and verify ownership
  const askDetails = await getAskDetails(swapId);
  console.log(`\nAsk details:`);
  console.log(`- Creator: ${askDetails.ftSender}`);
  console.log(
    `- Current amount: ${askDetails.amount} ${tokenSymbol} (in μ units)`
  );
  console.log(
    `- Current price: ${askDetails.ustx / 1_000_000} STX (${
      askDetails.ustx
    } μSTX)`
  );

  if (askDetails.ftSender !== address) {
    console.log(`\nError: Cannot reprice ask`);
    console.log(`- Your address: ${address}`);
    console.log(`- Required address: ${askDetails.ftSender}`);
    throw new Error(
      `Only the ask creator (${askDetails.ftSender}) can reprice this ask`
    );
  }

  console.log(`\nReprice details:`);
  console.log(`- New price: ${newUstx / 1_000_000} STX (${newUstx} μSTX)`);
  if (recipient) console.log(`- Making private offer to: ${recipient}`);
  if (expiry) console.log(`- Setting expiry to block: ${expiry}`);

  const txOptions = {
    contractAddress: JING_CONTRACTS.ASK.address,
    contractName: JING_CONTRACTS.ASK.name,
    functionName: "re-price",
    functionArgs: [
      uintCV(swapId),
      contractPrincipalCV(tokenInfo.contractAddress, tokenInfo.contractName),
      contractPrincipalCV(
        JING_CONTRACTS.YANG.address,
        JING_CONTRACTS.YANG.name
      ),
      uintCV(newUstx),
      expiry ? someCV(uintCV(expiry)) : noneCV(),
      recipient ? someCV(standardPrincipalCV(recipient)) : noneCV(),
    ],
    senderKey: key,
    validateWithAbi: true,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    nonce,
    fee: 10000,
  };

  try {
    console.log("Creating contract call...");
    const transaction = await makeContractCall(txOptions);
    console.log("Broadcasting transaction...");
    const broadcastResponse = await broadcastTransaction(transaction, network);
    console.log("Transaction broadcast successfully!");
    console.log("Transaction ID:", broadcastResponse.txid);
    console.log(
      `Monitor status at: https://explorer.stacks.co/txid/${broadcastResponse.txid}`
    );
    return broadcastResponse;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Error repricing ask: ${error.message}`);
    } else {
      console.error("An unknown error occurred while repricing ask");
    }
    throw error;
  }
}

// Parse command line arguments
const [swapId, newUstx, pair, recipient, expiry, accountIndex] =
  process.argv.slice(2);

if (!swapId || !newUstx || !pair) {
  console.error(
    "Usage: bun run src/jing/reprice-ask.ts <swap_id> <new_ustx> <pair> [recipient] [expiry] [account_index]"
  );
  console.error(
    "Example: bun run src/jing/reprice-ask.ts 1 200000000 PEPE-STX"
  );
  console.error(
    "Example with private offer: bun run src/jing/reprice-ask.ts 1 200000000 PEPE-STX SP2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2T0Z55KS 100000"
  );
  process.exit(1);
}

repriceAsk(
  parseInt(swapId),
  parseInt(newUstx),
  pair,
  recipient,
  expiry ? parseInt(expiry) : undefined,
  accountIndex ? parseInt(accountIndex) : 0
)
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
