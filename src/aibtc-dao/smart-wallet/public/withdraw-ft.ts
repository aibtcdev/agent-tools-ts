import {
  AnchorMode,
  Cl,
  makeContractCall,
  SignedContractCallOptions,
  PostConditionMode,
  Pc,
} from "@stacks/transactions";
import {
  broadcastTx,
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  getNetwork,
  getNextNonce,
  sendToLLM,
} from "../../../utilities";

const usage =
  "Usage: bun run withdraw-ft.ts <smartWalletContract> <ftContract> <amount>";
const usageExample =
  "Example: bun run withdraw-ft.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-smart-wallet ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-token 1000";

interface ExpectedArgs {
  smartWalletContract: string;
  ftContract: string;
  amount: number;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [smartWalletContract, ftContract, amountStr] = process.argv.slice(2);
  const amount = parseInt(amountStr);
  if (!smartWalletContract || !ftContract || !amount) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  // verify contract addresses extracted from arguments
  const [walletAddress, walletName] = smartWalletContract.split(".");
  const [ftAddress, ftName] = ftContract.split(".");
  if (!walletAddress || !walletName || !ftAddress || !ftName) {
    const errorMessage = [
      `Invalid contract addresses: ${smartWalletContract} ${ftContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  // verify amount is positive
  if (amount <= 0) {
    const errorMessage = [
      `Invalid amount: ${amount}. Amount must be positive.`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  return {
    smartWalletContract,
    ftContract,
    amount,
  };
}

async function main() {
  // validate and store provided args
  const args = validateArgs();
  const [contractAddress, contractName] = args.smartWalletContract.split(".");
  const [ftAddress, ftName] = args.ftContract.split(".");

  // setup network and wallet info
  const networkObj = getNetwork(CONFIG.NETWORK);
  const { address, key } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  const nextPossibleNonce = await getNextNonce(CONFIG.NETWORK, address);

  // Add post-conditions to ensure smart wallet sends exact amount of FT
  const postConditions = [
    Pc.principal(`${contractAddress}.${contractName}`)
      .willSendEq(args.amount)
      .ft(`${ftAddress}.${ftName}`, ftName),
  ];

  // prepare function arguments
  const functionArgs = [Cl.principal(args.ftContract), Cl.uint(args.amount)];

  // configure contract call options
  const txOptions: SignedContractCallOptions = {
    anchorMode: AnchorMode.Any,
    contractAddress,
    contractName,
    functionName: "withdraw-ft",
    functionArgs,
    network: networkObj,
    nonce: nextPossibleNonce,
    senderKey: key,
    postConditionMode: PostConditionMode.Deny, // Ensures no other transfers are allowed
    postConditions,
  };

  // broadcast transaction and return response
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
