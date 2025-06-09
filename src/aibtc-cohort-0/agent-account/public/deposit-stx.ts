import {
  Cl,
  makeContractCall,
  SignedContractCallOptions,
  PostConditionMode,
  Pc,
  makeUnsignedContractCall,
  privateKeyToPublic,
  UnsignedContractCallOptions,
} from "@stacks/transactions";
import {
  broadcastTx,
  broadcastSponsoredTx,
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  getNetwork,
  getNextNonce,
  isValidContractPrincipal,
  sendToLLM,
} from "../../../utilities";

const usage = "Usage: bun run deposit-stx.ts <agentAccountContract> <amount>";
const usageExample =
  "Example: bun run deposit-stx.ts ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-agent-account-test 1000000"; // 1 STX

interface ExpectedArgs {
  agentAccountContract: string;
  amount: number; // amount in microSTX
}

function validateArgs(): ExpectedArgs {
  const [agentAccountContract, amountStr] = process.argv.slice(2);
  const amount = parseInt(amountStr);
  if (
    !agentAccountContract ||
    !amountStr ||
    isNaN(amount)
  ) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  if (!isValidContractPrincipal(agentAccountContract)) {
    const errorMessage = [
      `Invalid agent account contract address: ${agentAccountContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  if (amount <= 0) {
    const errorMessage = [
      `Invalid amount: ${amount}. Amount must be positive and in microSTX.`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  return {
    agentAccountContract,
    amount,
  };
}

async function main() {
  const args = validateArgs();
  const [contractAddress, contractName] = args.agentAccountContract.split(
    "."
  );

  const networkObj = getNetwork(CONFIG.NETWORK);
  const { address, key } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  const pubKey = privateKeyToPublic(key);

  /**
   * Uncomment to send directly by signing / paying for the transaction
   * requires makeContractCall() and broadcastTx()
  const nextPossibleNonce = await getNextNonce(CONFIG.NETWORK, address);
  */

  const postConditions = [
    Pc.principal(address) // The sender (user running the script)
      .willSendEq(args.amount) // Amount in microSTX
      .ustx(), // To the agent account
  ];

  const functionArgs = [Cl.uint(args.amount)];

  /**
   * Uncomment to send directly by signing / paying for the transaction
   * requires makeContractCall() and broadcastTx()
  const txOptions: SignedContractCallOptions = {
    contractAddress,
    contractName,
    functionName: "deposit-stx",
    functionArgs,
    network: networkObj,
    nonce: nextPossibleNonce,
    senderKey: key,
    postConditionMode: PostConditionMode.Deny,
    postConditions,
  };
  */

  const unsignedTxOptions: UnsignedContractCallOptions = {
    contractAddress,
    contractName,
    functionName: "deposit-stx",
    functionArgs,
    network: networkObj,
    publicKey: pubKey,
    sponsored: true,
    postConditionMode: PostConditionMode.Deny,
    postConditions,
  };

  try {
    const unsignedTx = await makeUnsignedContractCall(unsignedTxOptions);
    const broadcastResponse = await broadcastSponsoredTx(
      unsignedTx,
      networkObj
    );
    // const transaction = await makeContractCall(txOptions);
    // const broadcastResponse = await broadcastTx(transaction, networkObj);
    return broadcastResponse;
  } catch (error) {
    const errorMessage = [
      `Error depositing STX to agent account:`,
      `${error instanceof Error ? error.message : String(error)}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
