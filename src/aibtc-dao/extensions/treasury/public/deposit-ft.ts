import {
  AnchorMode,
  Cl,
  makeContractCall,
  SignedContractCallOptions,
} from "@stacks/transactions";
import {
  broadcastTx,
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  getNetwork,
  getNextNonce,
  sendToLLM,
} from "../../../../utilities";

const usage =
  "Usage: bun run deposit-ft.ts <treasuryContract> <ftContract> <amount>";
const usageExample =
  "Example: bun run deposit-ft.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtcdao-treasury ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.token-ft 1000";

interface ExpectedArgs {
  treasuryContract: string;
  ftContract: string;
  amount: number;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [treasuryContract, ftContract, amountStr] = process.argv.slice(2);
  const amount = parseInt(amountStr);
  if (!treasuryContract || !ftContract || !amount) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // verify contract addresses extracted from arguments
  const [treasuryAddress, treasuryName] = treasuryContract.split(".");
  const [ftAddress, ftName] = ftContract.split(".");
  if (!treasuryAddress || !treasuryName || !ftAddress || !ftName) {
    const errorMessage = [
      `Invalid contract addresses: ${treasuryContract} ${ftContract}`,
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
  // return validated arguments
  return {
    treasuryContract,
    ftContract,
    amount,
  };
}

async function main() {
  // validate and store provided args
  const args = validateArgs();
  const [contractAddress, contractName] = args.treasuryContract.split(".");
  // setup network and wallet info
  const networkObj = getNetwork(CONFIG.NETWORK);
  const { address, key } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  const nextPossibleNonce = await getNextNonce(CONFIG.NETWORK, address);
  // prepare function arguments
  const functionArgs = [
    Cl.contractPrincipal(...args.ftContract.split(".")),
    Cl.uint(args.amount),
  ];
  // configure contract call options
  const txOptions: SignedContractCallOptions = {
    anchorMode: AnchorMode.Any,
    contractAddress,
    contractName,
    functionName: "deposit-ft",
    functionArgs,
    network: networkObj,
    nonce: nextPossibleNonce,
    senderKey: key,
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
