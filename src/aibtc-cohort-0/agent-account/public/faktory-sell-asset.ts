import {
  Cl,
  makeContractCall,
  PostConditionMode,
  SignedContractCallOptions,
  FungibleConditionCode,
  PostConditionType,
  PostCondition,
  FungiblePostCondition,
} from "@stacks/transactions";
import {
  broadcastTx,
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  getNetwork,
  getNextNonce,
  isValidContractPrincipal,
  sendToLLM,
} from "../../../utilities";
import { FaktorySDK } from "@faktoryfun/core-sdk";

const faktoryConfig = {
  network: CONFIG.NETWORK as "mainnet" | "testnet",
  hiroApiKey: CONFIG.HIRO_API_KEY,
};

const usage =
  "Usage: bun run faktory-sell-asset.ts <agentAccountContract> <faktoryDexContract> <assetContract> <amountToSell> [slippage]";
const usageExample =
  "Example: bun run faktory-sell-asset.ts ST1..agent ST2..dex ST2..token 1000 1";

interface ExpectedArgs {
  agentAccountContract: string;
  faktoryDexContract: string;
  assetContract: string;
  amountToSell: number;
  slippage: number;
}

function validateArgs(): ExpectedArgs {
  const [
    agentAccountContract,
    faktoryDexContract,
    assetContract,
    amountToSellStr,
    slippageStr,
  ] = process.argv.slice(2);
  const amountToSell = parseFloat(amountToSellStr);
  const slippage = parseInt(slippageStr) || 1; // Default 1% slippage

  if (
    !agentAccountContract ||
    !faktoryDexContract ||
    !assetContract ||
    !amountToSellStr ||
    isNaN(amountToSell)
  ) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  if (!isValidContractPrincipal(agentAccountContract)) {
    throw new Error(`Invalid agent account contract address: ${agentAccountContract}`);
  }
  if (!isValidContractPrincipal(faktoryDexContract)) {
    throw new Error(`Invalid Faktory DEX contract address: ${faktoryDexContract}`);
  }
  if (!isValidContractPrincipal(assetContract)) {
    throw new Error(`Invalid asset contract address: ${assetContract}`);
  }
  if (amountToSell <= 0) {
    throw new Error(`Invalid amount to sell: ${amountToSell}. Must be positive.`);
  }
  if (slippage < 0 || slippage > 100) {
    throw new Error(`Invalid slippage: ${slippage}. Must be between 0 and 100.`);
  }

  return {
    agentAccountContract,
    faktoryDexContract,
    assetContract,
    amountToSell,
    slippage,
  };
}

async function main() {
  const args = validateArgs();
  const [agentAccountContractAddress, agentAccountContractName] =
    args.agentAccountContract.split(".");

  const networkObj = getNetwork(CONFIG.NETWORK);
  const { address, key } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  const nextPossibleNonce = await getNextNonce(CONFIG.NETWORK, address);

  const sdk = new FaktorySDK(faktoryConfig);

  // The aibtc-faktory-dex contract does not accept a slippage parameter directly.
  // Therefore, we use the Faktory SDK to calculate the minimum amount of the payment asset
  // we should receive for our tokens, given the slippage tolerance. This is enforced
  // via a Stacks post-condition, which protects the agent account from price
  // volatility and front-running at the transaction level.
  const sellParams = await sdk.getSellParams({
    dexContract: args.faktoryDexContract,
    amount: args.amountToSell,
    senderAddress: args.agentAccountContract, // The agent is the one selling
    slippage: args.slippage,
  });

  // Find the post-condition for sending the asset to determine the exact uint amount
  const assetSendPostCondition = sellParams.postConditions.find(
    (pc: PostCondition) =>
      pc.conditionType === PostConditionType.Fungible &&
      pc.conditionCode === FungibleConditionCode.Equal
  ) as FungiblePostCondition | undefined;

  // Find the post-condition for receiving the payment asset to determine the minimum amount to receive
  const paymentReceivePostCondition = sellParams.postConditions.find(
    (pc: PostCondition) =>
      pc.conditionType === PostConditionType.Fungible &&
      pc.conditionCode === FungibleConditionCode.GreaterEqual
  ) as FungiblePostCondition | undefined;

  if (!assetSendPostCondition || !paymentReceivePostCondition) {
    throw new Error("Could not determine trade parameters from Faktory SDK.");
  }

  const amountToSellUint = assetSendPostCondition.amount;

  // The agent contract is expected to have a function with this signature:
  // (define-public (faktory-sell-asset (faktory-dex <dao-faktory-dex>) (asset <faktory-token>) (amount uint)) ...)
  // The `amount` here is the amount of the token to sell.
  const functionArgs = [
    Cl.principal(args.faktoryDexContract),
    Cl.principal(args.assetContract),
    Cl.uint(amountToSellUint),
  ];

  const txOptions: SignedContractCallOptions = {
    contractAddress: agentAccountContractAddress,
    contractName: agentAccountContractName,
    functionName: "faktory-sell-asset",
    functionArgs,
    network: networkObj,
    nonce: nextPossibleNonce,
    senderKey: key,
    postConditionMode: PostConditionMode.Deny,
    postConditions: [assetSendPostCondition, paymentReceivePostCondition],
  };

  const transaction = await makeContractCall(txOptions);
  const broadcastResponse = await broadcastTx(transaction, networkObj);
  return broadcastResponse;
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
