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
  "Usage: bun run sell-dao-token.ts <agentAccountContract> <swapAdapterContract> <daoTokenContract> <amountToSell> [minReceive]";
const usageExample =
  "Example: bun run sell-dao-token.ts ST1..agent ST1..adapter ST2..token 1000 1";

interface ExpectedArgs {
  agentAccountContract: string;
  swapAdapterContract: string;
  daoTokenContract: string;
  amountToSell: number;
  minReceive?: bigint;
}

function validateArgs(): ExpectedArgs {
  const [
    agentAccountContract,
    swapAdapterContract,
    daoTokenContract,
    amountToSellStr,
    minReceiveStr,
  ] = process.argv.slice(2);
  const amountToSell = parseFloat(amountToSellStr);
  let minReceive: bigint | undefined;
  if (minReceiveStr) {
    try {
      minReceive = BigInt(minReceiveStr);
    } catch (e) {
      throw new Error(
        `Invalid minReceive value: ${minReceiveStr}. Must be a valid integer.`
      );
    }
  }

  if (
    !agentAccountContract ||
    !swapAdapterContract ||
    !daoTokenContract ||
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
  if (!isValidContractPrincipal(swapAdapterContract)) {
    throw new Error(`Invalid swap adapter contract address: ${swapAdapterContract}`);
  }
  if (!isValidContractPrincipal(daoTokenContract)) {
    throw new Error(`Invalid DAO token contract address: ${daoTokenContract}`);
  }
  if (amountToSell <= 0) {
    throw new Error(`Invalid amount to sell: ${amountToSell}. Must be positive.`);
  }

  return {
    agentAccountContract,
    swapAdapterContract,
    daoTokenContract,
    amountToSell,
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

  // TODO: The amountToSell is a float/number, but the contract expects a uint.
  // This requires knowing the decimals of the token being sold.
  // For now, we'll assume the input is already in the smallest unit (e.g., satoshis).
  // A more robust solution would fetch token decimals and convert.
  const amountToSellUint = Math.floor(args.amountToSell);

  // The agent contract is expected to have a function with this signature:
  // (define-public (sell-dao-token (swapAdapter <dao-swap-adapter>) (daoToken <ft-trait>) (amount uint) (minReceive (optional uint))))
  const functionArgs = [
    Cl.principal(args.swapAdapterContract),
    Cl.principal(args.daoTokenContract),
    Cl.uint(amountToSellUint),
    args.minReceive ? Cl.some(Cl.uint(args.minReceive)) : Cl.none(),
  ];

  const txOptions: SignedContractCallOptions = {
    contractAddress: agentAccountContractAddress,
    contractName: agentAccountContractName,
    functionName: "sell-dao-token",
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
