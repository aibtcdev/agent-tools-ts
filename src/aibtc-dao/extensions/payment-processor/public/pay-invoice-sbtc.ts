import {
  AnchorMode,
  Cl,
  makeContractCall,
  SignedContractCallOptions,
  PostConditionMode,
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
  getPmtResourceByIndex,
  getSbtcContract,
  isValidContractPrincipal,
  sendToLLM,
} from "../../../../utilities";

const usage =
  "Usage: bun run pay-invoice-sbtc.ts <paymentProcessorContract> <resourceIndex> [memo]";
const usageExample =
  "Example: bun run pay-invoice-sbtc.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-payment-processor-sbtc 1";

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
    resourceIndex,
    memo,
  };
}

async function main() {
  // validate and store provided args
  const args = validateArgs();
  const { paymentProcessorContract, resourceIndex, memo } = args;
  const [contractAddress, contractName] = paymentProcessorContract.split(".");

  // setup network and wallet info
  const networkObj = getNetwork(CONFIG.NETWORK);
  const { address, key } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  const nextPossibleNonce = await getNextNonce(CONFIG.NETWORK, address);

  // Get resource details to set proper post-conditions
  const resourceData = (await getPmtResourceByIndex(
    paymentProcessorContract,
    address,
    args.resourceIndex
  )) as ResourceData;

  const { price } = resourceData;

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

  console.log(
    `Paying invoice with sBTC for resource ${resourceIndex}`
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
