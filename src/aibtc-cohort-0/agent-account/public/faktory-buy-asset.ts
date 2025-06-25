import {
  Cl,
  makeContractCall,
  PostConditionMode,
  SignedContractCallOptions,
  PostCondition,
  PostConditionType,
  FungibleConditionCode,
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
  "Usage: bun run faktory-buy-asset.ts <agentAccountContract> <faktoryDexContract> <assetContract> <amountToSpend> [slippage]";
const usageExample =
  "Example: bun run faktory-buy-asset.ts ST1..agent ST2..dex ST2..token 0.5 1";

interface ExpectedArgs {
  agentAccountContract: string;
  faktoryDexContract: string;
  assetContract: string;
  amountToSpend: number;
  slippage: number;
}

function validateArgs(): ExpectedArgs {
  const [
    agentAccountContract,
    faktoryDexContract,
    assetContract,
    amountToSpendStr,
    slippageStr,
  ] = process.argv.slice(2);
  const amountToSpend = parseFloat(amountToSpendStr);
  const slippage = parseInt(slippageStr) || 1; // Default 1% slippage

  if (
    !agentAccountContract ||
    !faktoryDexContract ||
    !assetContract ||
    !amountToSpendStr ||
    isNaN(amountToSpend)
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
  if (amountToSpend <= 0) {
    throw new Error(`Invalid amount to spend: ${amountToSpend}. Must be positive.`);
  }
  if (slippage < 0 || slippage > 100) {
    throw new Error(`Invalid slippage: ${slippage}. Must be between 0 and 100.`);
  }

  return {
    agentAccountContract,
    faktoryDexContract,
    assetContract,
    amountToSpend,
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

  // Get buy parameters from the SDK to determine trade details
  const buyParams = await sdk.getBuyParams({
    dexContract: args.faktoryDexContract,
    inAmount: args.amountToSpend,
    senderAddress: args.agentAccountContract, // The agent is the one buying
    slippage: args.slippage,
  });

  // Extract the exact amount of the payment asset to spend from the SDK's proposed function call
  const amountToSpendUint = (buyParams.functionArgs[2] as any).value;

  // Find the post-condition for receiving the desired asset to determine the minimum amount to receive
  const assetReceivePostCondition = buyParams.postConditions.find(
    (pc: PostCondition) =>
      pc.conditionType === PostConditionType.Fungible &&
      pc.conditionCode === FungibleConditionCode.GreaterEqual
  ) as FungiblePostCondition | undefined;

  // Find the post-condition for sending the payment asset
  const paymentSendPostCondition = buyParams.postConditions.find(
    (pc: PostCondition) =>
      pc.conditionType === PostConditionType.Fungible &&
      pc.conditionCode === FungibleConditionCode.LessEqual
  ) as FungiblePostCondition | undefined;

  if (!assetReceivePostCondition || !paymentSendPostCondition) {
    throw new Error("Could not determine trade parameters from Faktory SDK.");
  }

  const minAmountToReceive = assetReceivePostCondition.amount;

  // The agent contract is expected to have a function with this signature:
  // (define-public (faktory-buy-asset (dex principal) (token principal) (amount-to-spend uint) (min-to-receive uint)) ...)
  const functionArgs = [
    Cl.principal(args.faktoryDexContract),
    Cl.principal(args.assetContract),
    Cl.uint(amountToSpendUint),
    Cl.uint(minAmountToReceive),
  ];

  const txOptions: SignedContractCallOptions = {
    contractAddress: agentAccountContractAddress,
    contractName: agentAccountContractName,
    functionName: "faktory-buy-asset",
    functionArgs,
    network: networkObj,
    nonce: nextPossibleNonce,
    senderKey: key,
    postConditionMode: PostConditionMode.Deny,
    postConditions: [paymentSendPostCondition, assetReceivePostCondition],
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
