import {
  AnchorMode,
  Cl,
  makeContractCall,
  SignedContractCallOptions,
  PostConditionMode,
  callReadOnlyFunction,
  ClarityType,
  cvToValue,
  Pc,
} from "@stacks/transactions";
import { ResourceData } from "../../../types/dao-types";
import {
  broadcastTx,
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  formatContractAddress,
  getNetwork,
  getNextNonce,
  getSbtcContract,
  isValidContractPrincipal,
  sendToLLM,
} from "../../../../utilities";

const usage =
  "Usage: bun run pay-invoice-by-resource-name-sbtc.ts <paymentProcessorContract> <resourceName> [memo]";
const usageExample =
  "Example: bun run pay-invoice-by-resource-name-sbtc.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-payment-processor-sbtc resource-name";

interface ExpectedArgs {
  paymentProcessorContract: string;
  resourceName: string;
  memo?: string;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [paymentProcessorContract, resourceName, memo] = process.argv.slice(2);
  if (!paymentProcessorContract || !resourceName) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // verify contract addresses extracted from arguments
  if (!isValidContractPrincipal(paymentProcessorContract)) {
    const errorMessage = [
      `Invalid contract address: ${paymentProcessorContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  
  // Verify this is an sBTC payment processor contract
  const [_, contractName] = paymentProcessorContract.split(".");
  if (!contractName.includes("-sbtc")) {
    const errorMessage = [
      `Expected sBTC payment processor contract, got: ${contractName}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  
  // return validated arguments
  return {
    paymentProcessorContract,
    resourceName,
    memo,
  };
}

async function main() {
  // validate and store provided args
  const args = validateArgs();
  const [contractAddress, contractName] =
    args.paymentProcessorContract.split(".");

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
    functionArgs: [Cl.stringUtf8(args.resourceName)],
    senderAddress: address,
    network: networkObj,
  });

  if (resourceData.type !== ClarityType.OptionalSome) {
    throw new Error(
      `Resource not found in ${args.paymentProcessorContract} for name ${args.resourceName}`
    );
  }

  const resource = cvToValue(resourceData.value, true) as ResourceData;
  const { price } = resource;

  // Set sBTC-specific post condition
  const sbtcContract = getSbtcContract(CONFIG.NETWORK);
  const formattedSbtcContract = formatContractAddress(sbtcContract);
  const postConditions = [
    Pc.principal(address)
      .willSendEq(price)
      .ft(formattedSbtcContract, "sbtc-token")
  ];

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
    postConditionMode: PostConditionMode.Deny,
    postConditions,
  };

  console.log(
    `Paying invoice with sBTC for resource ${args.resourceName}`
  );

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
