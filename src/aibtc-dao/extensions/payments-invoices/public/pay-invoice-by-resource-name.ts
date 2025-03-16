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
import { ResourceData } from "../../../types/dao-types";

const usage =
  "Usage: bun run pay-invoice-by-resource-name.ts <paymentsInvoicesContract> <resourceName> [memo]";
const usageExample =
  "Example: bun run pay-invoice-by-resource-name.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-payments-invoices resource-name";

interface ExpectedArgs {
  paymentsInvoicesContract: string;
  resourceName: string;
  memo?: string;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [paymentsInvoicesContract, resourceName, memo] = process.argv.slice(2);
  if (!paymentsInvoicesContract || !resourceName) {
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
    resourceName,
    memo,
  };
}

async function main() {
  // validate and store provided args
  const args = validateArgs();
  const [contractAddress, contractName] =
    args.paymentsInvoicesContract.split(".");

  // setup network and wallet info
  const networkObj = getNetwork(CONFIG.NETWORK);
  const { address, key } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  const nextPossibleNonce = await getNextNonce(CONFIG.NETWORK, address);

  // Get resource details to set proper post-conditions
  const resourceData = await callReadOnlyFunction({
    contractAddress,
    contractName,
    functionName: "get-resource-by-name",
    functionArgs: [Cl.stringAscii(args.resourceName)],
    senderAddress: address,
    network: networkObj,
  });

  if (resourceData.type !== ClarityType.OptionalSome) {
    throw new Error(
      `Resource not found in ${args.paymentsInvoicesContract} for name ${args.resourceName}`
    );
  }

  const resource = cvToValue(resourceData.value, true) as ResourceData;
  const { price } = resource;

  // Set post-conditions for STX transfer
  // Note: The contract only handles STX payments currently
  const postConditions = [Pc.principal(address).willSendEq(price).ustx()];

  // prepare function arguments
  const functionArgs = [
    Cl.stringUtf8(args.resourceName),
    args.memo ? Cl.some(Cl.stringUtf8(args.memo)) : Cl.none(),
  ];

  // configure contract call options
  const txOptions: SignedContractCallOptions = {
    anchorMode: AnchorMode.Any,
    contractAddress,
    contractName,
    functionName: "pay-invoice-by-resource-name",
    functionArgs,
    network: networkObj,
    nonce: nextPossibleNonce,
    senderKey: key,
    postConditionMode: PostConditionMode.Deny, // Strictly enforce post-conditions
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
