import {
  Cl,
  makeContractCall,
  PostConditionMode,
  SignedContractCallOptions,
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

const usage =
  "Usage: bun run buy-dao-token.ts <agentAccountContract> <swapAdapterContract> <daoTokenContract> <amountToSpend> [minReceive]";
const usageExample =
  "Example: bun run buy-dao-token.ts ST1..agent ST1..adapter ST2..token 0.5 1000";

interface ExpectedArgs {
  agentAccountContract: string;
  swapAdapterContract: string;
  daoTokenContract: string;
  amountToSpend: number;
  minReceive: number;
}

function validateArgs(): ExpectedArgs {
  const [
    agentAccountContract,
    swapAdapterContract,
    daoTokenContract,
    amountToSpendStr,
    minReceiveStr,
  ] = process.argv.slice(2);
  const amountToSpend = parseFloat(amountToSpendStr);
  // Default minReceive to 1 if not provided, as swap adapters require it.
  const minReceive = parseInt(minReceiveStr) || 1;

  if (
    !agentAccountContract ||
    !swapAdapterContract ||
    !daoTokenContract ||
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
  if (!isValidContractPrincipal(swapAdapterContract)) {
    throw new Error(`Invalid swap adapter contract address: ${swapAdapterContract}`);
  }
  if (!isValidContractPrincipal(daoTokenContract)) {
    throw new Error(`Invalid DAO token contract address: ${daoTokenContract}`);
  }
  if (amountToSpend <= 0) {
    throw new Error(`Invalid amount to spend: ${amountToSpend}. Must be positive.`);
  }

  return {
    agentAccountContract,
    swapAdapterContract,
    daoTokenContract,
    amountToSpend,
    minReceive,
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

  // TODO: The amountToSpend is a float, but the contract expects a uint.
  // This requires knowing the decimals of the payment asset (e.g., sBTC has 8).
  // For now, we'll assume sBTC and multiply by 10^8.
  // A more robust solution would fetch token decimals.
  const amountToSpendUint = Math.floor(args.amountToSpend * 10 ** 8);

  // The agent contract is expected to have a function with this signature:
  // (define-public (buy-dao-token (swapAdapter <dao-swap-adapter>) (daoToken <ft-trait>) (amount uint) (minReceive (optional uint))))
  const functionArgs = [
    Cl.principal(args.swapAdapterContract),
    Cl.principal(args.daoTokenContract),
    Cl.uint(amountToSpendUint),
    Cl.some(Cl.uint(args.minReceive)), // Adapters require minReceive, so we use `some`
  ];

  const txOptions: SignedContractCallOptions = {
    contractAddress: agentAccountContractAddress,
    contractName: agentAccountContractName,
    functionName: "buy-dao-token",
    functionArgs,
    network: networkObj,
    nonce: nextPossibleNonce,
    senderKey: key,
    postConditionMode: PostConditionMode.Deny,
    postConditions: [], // TODO: Add post-conditions for security
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
