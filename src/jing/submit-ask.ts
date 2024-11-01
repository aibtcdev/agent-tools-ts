import {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  uintCV,
  contractPrincipalCV,
  makeStandardSTXPostCondition,
  makeContractFungiblePostCondition,
  FungibleConditionCode,
  callReadOnlyFunction,
  cvToJSON,
  createAssetInfo,
} from "@stacks/transactions";
import {
  CONFIG,
  getNetwork,
  deriveChildAccount,
  getNextNonce,
} from "../utilities";
import {
  getTokenInfo,
  JING_CONTRACTS,
  calculateAskFees,
} from "./utils-token-pairs";

async function getAskDetails(swapId: number) {
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
  };
}

async function submitAsk(
  swapId: number,
  pair: string,
  accountIndex: number = 0
) {
  const tokenInfo = getTokenInfo(pair);
  if (!tokenInfo) {
    throw new Error(`Failed to get token info for pair: ${pair}`);
  }

  const network = getNetwork(CONFIG.NETWORK);
  const { address, key } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    accountIndex
  );
  const nonce = await getNextNonce(CONFIG.NETWORK, address);

  // Get ask details for post conditions
  const askDetails = await getAskDetails(swapId);
  const fees = calculateAskFees(askDetails.amount);

  const postConditions = [
    // You send STX
    makeStandardSTXPostCondition(
      address,
      FungibleConditionCode.Equal,
      askDetails.ustx
    ),
    // Contract sends FT
    makeContractFungiblePostCondition(
      JING_CONTRACTS.ASK.address,
      JING_CONTRACTS.ASK.name,
      FungibleConditionCode.Equal,
      askDetails.amount,
      createAssetInfo(
        tokenInfo.contractAddress,
        tokenInfo.contractName,
        tokenInfo.assetName
      )
    ),
    // Fees from YANG contract
    makeContractFungiblePostCondition(
      JING_CONTRACTS.ASK.address,
      JING_CONTRACTS.YANG.name,
      FungibleConditionCode.LessEqual,
      fees,
      createAssetInfo(
        tokenInfo.contractAddress,
        tokenInfo.contractName,
        tokenInfo.assetName
      )
    ),
  ];

  const txOptions = {
    contractAddress: JING_CONTRACTS.ASK.address,
    contractName: JING_CONTRACTS.ASK.name,
    functionName: "submit-swap",
    functionArgs: [
      uintCV(swapId),
      contractPrincipalCV(tokenInfo.contractAddress, tokenInfo.contractName),
      contractPrincipalCV(
        JING_CONTRACTS.YANG.address,
        JING_CONTRACTS.YANG.name
      ),
    ],
    senderKey: key,
    validateWithAbi: true,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Deny,
    postConditions,
    nonce,
    fee: 30000,
  };

  try {
    console.log("Creating contract call...");
    console.log(`Submitting swap for ask ${swapId}:`);
    console.log(`- You send: ${askDetails.ustx / 1_000_000} STX`);
    console.log(
      `- You receive: ${askDetails.amount} ${pair.split("-")[0]} (in μ units)`
    );
    console.log(
      `- Transaction includes ${fees} ${
        pair.split("-")[0]
      } fee (in μ units) from YANG contract`
    );

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
      console.error(`Error submitting swap: ${error.message}`);
    } else {
      console.error("An unknown error occurred while submitting swap");
    }
    throw error;
  }
}

// Parse command line arguments
const [swapId, pair, accountIndex] = process.argv.slice(2);

if (!swapId || !pair) {
  console.error(
    "Usage: bun run src/jing/submit-ask.ts <swap_id> <pair> [account_index]"
  );
  console.error("Example: bun run src/jing/submit-ask.ts 12 PEPE-STX");
  process.exit(1);
}
// bun run src/jing/submit-ask.ts 5 PEPE-STX
submitAsk(parseInt(swapId), pair, accountIndex ? parseInt(accountIndex) : 0)
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
