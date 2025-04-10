import {
  AnchorMode,
  Cl,
  makeContractCall,
  SignedContractCallOptions,
  PostConditionMode,
  callReadOnlyFunction,
  ClarityType,
  cvToValue,
} from "@stacks/transactions";
import { ResourceData } from "../../../types/dao-types";
import {
  broadcastTx,
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  getNetwork,
  getNextNonce,
  sendToLLM,
} from "../../../../utilities";
import { 
  getTokenTypeFromContractName, 
  createPostConditions 
} from "../utils/token-utils";

const usage =
  "Usage: bun run pay-invoice.ts <paymentProcessorContract> <resourceIndex> [memo]";
const usageExample =
  "Example: bun run pay-invoice.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-payment-processor-stx 1";

interface ExpectedArgs {
  paymentProcessorContract: string;
  resourceIndex: number;
  memo?: string;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [paymentProcessorContract, resourceIndexStr, memo] =
    process.argv.slice(2);
  const resourceIndex = parseInt(resourceIndexStr);
  if (!paymentProcessorContract || !resourceIndex) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // verify contract addresses extracted from arguments
  const [contractAddress, contractName] = paymentProcessorContract.split(".");
  if (!contractAddress || !contractName) {
    const errorMessage = [
      `Invalid contract address: ${paymentProcessorContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // return validated arguments
  return {
    paymentProcessorContract,
    resourceIndex,
    memo,
  };
}

async function main() {
  // validate and store provided args
  const args = validateArgs();
  const { paymentProcessorContract, resourceIndex, memo } = args;
  const [contractAddress, contractName] = paymentProcessorContract.split(".");

  // Determine token type from contract name
  const tokenType = getTokenTypeFromContractName(contractName);

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
    functionName: "get-resource",
    functionArgs: [Cl.uint(resourceIndex)],
    senderAddress: address,
    network: networkObj,
  });

  if (resourceData.type !== ClarityType.OptionalSome) {
    throw new Error(
      `Resource not found in ${paymentProcessorContract} for index ${resourceIndex}`
    );
  }

  const resource = cvToValue(resourceData.value, true) as ResourceData;
  const { price } = resource;

  // Set post-conditions based on token type and resource price
  const postConditions = await createPostConditions(
    tokenType,
    contractAddress,
    contractName,
    address,
    price,
    networkObj
  );

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

  console.log(`Paying invoice with ${tokenType} token for resource ${resourceIndex}`);

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
