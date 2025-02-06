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
  "Usage: bun run pay-invoice.ts <paymentsInvoicesContract> <resourceIndex> [memo]";
const usageExample =
  "Example: bun run pay-invoice.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtcdao-payments-invoices 1";

interface ExpectedArgs {
  paymentsInvoicesContract: string;
  resourceIndex: number;
  memo?: string;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [paymentsInvoicesContract, resourceIndexStr, memo] = process.argv.slice(2);
  const resourceIndex = parseInt(resourceIndexStr);
  if (!paymentsInvoicesContract || !resourceIndex) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // verify contract addresses extracted from arguments
  const [contractAddress, contractName] = paymentsInvoicesContract.split(".");
  if (!contractAddress || !contractName) {
    const errorMessage = [
      `Invalid contract address: ${paymentsInvoicesContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // return validated arguments
  return {
    paymentsInvoicesContract,
    resourceIndex,
    memo,
  };
}

async function main() {
  // validate and store provided args
  const args = validateArgs();
  const [contractAddress, contractName] = args.paymentsInvoicesContract.split(".");
  // setup network and wallet info
  const networkObj = getNetwork(CONFIG.NETWORK);
  const { address, key } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  const nextPossibleNonce = await getNextNonce(CONFIG.NETWORK, address);
  // prepare function arguments
  const functionArgs = [Cl.uint(args.resourceIndex)];
  if (args.memo) {
    functionArgs.push(Cl.some(Cl.bufferFromUtf8(args.memo)));
  } else {
    functionArgs.push(Cl.none());
  }
  // configure contract call options
  const txOptions: SignedContractCallOptions = {
    anchorMode: AnchorMode.Any,
    contractAddress,
    contractName,
    functionName: "pay-invoice",
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
