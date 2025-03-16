import {
  AnchorMode,
  Cl,
  makeContractCall,
  SignedContractCallOptions,
  PostConditionMode,
  Pc,
  callReadOnlyFunction,
  ClarityType,
  cvToValue,
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

// Match the contract's InvoiceData map structure
interface InvoiceData {
  amount: number;
  createdAt: number;
  userIndex: number;
  resourceName: string;
  resourceIndex: number;
}

type ContractAddress = `${string}.${string}`;

// Helper function to ensure contract address has correct type
function formatContractAddress(address: string): ContractAddress {
  const [addr, name] = address.split(".");
  if (!addr || !name) {
    throw new Error(`Invalid contract address format: ${address}`);
  }
  return `${addr}.${name}` as ContractAddress;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [paymentsInvoicesContract, resourceIndexStr, memo] =
    process.argv.slice(2);
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
  const { paymentsInvoicesContract, resourceIndex, memo } = args;
  const [contractAddress, contractName] = paymentsInvoicesContract.split(".");
  
  // setup network and wallet info
  const networkObj = getNetwork(CONFIG.NETWORK);
  const { address, key } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  const nextPossibleNonce = await getNextNonce(CONFIG.NETWORK, address);

  // Get invoice details to set proper post-conditions
  const invoiceResult = await callReadOnlyFunction({
    contractAddress,
    contractName,
    functionName: "get-invoice",
    functionArgs: [Cl.uint(resourceIndex)],
    senderAddress: address,
    network: networkObj,
  });

  if (invoiceResult.type !== ClarityType.OptionalSome) {
    throw new Error(`Invoice not found: ${resourceIndex}`);
  }

  const invoice = cvToValue(invoiceResult.value, true) as InvoiceData;
  const { amount } = invoice;

  // Set post-conditions based on invoice amount
  // Note: Contract only supports STX payments currently
  const postConditions = [
    Pc.principal(address)
      .willSendEq(amount)
      .ustx()
  ];

  // prepare function arguments
  const functionArgs = [
    Cl.uint(resourceIndex),
    memo ? Cl.some(Cl.stringUtf8(memo)) : Cl.none(),
  ];
  
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
    postConditionMode: PostConditionMode.Deny,
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
