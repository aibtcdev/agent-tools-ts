import {
  AnchorMode,
  Cl,
  makeContractCall,
  SignedContractCallOptions,
  PostConditionMode,
  fetchCallReadOnlyFunction,
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
  getPmtContractInfo,
  isValidContractPrincipal,
  sendToLLM,
} from "../../../../utilities";
import { TokenInfoService } from "../../../../api/token-info-service";

const usage =
  "Usage: bun run pay-invoice-by-resource-name-dao.ts <paymentProcessorContract> <resourceName> [memo]";
const usageExample =
  "Example: bun run pay-invoice-by-resource-name-dao.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-payment-processor-dao resource-name";

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

  // Verify this is a DAO payment processor contract
  const [_, contractName] = paymentProcessorContract.split(".");
  if (!contractName.includes("-dao")) {
    const errorMessage = [
      `Expected DAO payment processor contract, got: ${contractName}`,
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
  const resourceData = await fetchCallReadOnlyFunction({
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

  // Get payment processor contract data to find the DAO token contract
  const paymentProcessorContractData = await getPmtContractInfo(
    args.paymentProcessorContract,
    address
  );

  // Set DAO token-specific post condition
  const formattedDaoContract = formatContractAddress(
    paymentProcessorContractData.daoTokenContract
  );

  const tokenInfoService = new TokenInfoService(CONFIG.NETWORK);
  const assetName = await tokenInfoService.getAssetNameFromAbi(
    paymentProcessorContractData.daoTokenContract
  );

  if (!assetName) {
    throw new Error(
      `Asset name not found for token contract: ${paymentProcessorContractData.daoTokenContract}`
    );
  }

  const postConditions = [
    Pc.principal(address).willSendEq(price).ft(formattedDaoContract, assetName),
  ];

  // prepare function arguments
  const functionArgs = [
    Cl.stringUtf8(args.resourceName),
    args.memo ? Cl.some(Cl.stringUtf8(args.memo)) : Cl.none(),
  ];

  // configure contract call options
  const txOptions: SignedContractCallOptions = {
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
    `Paying invoice with DAO token (${assetName}) for resource ${args.resourceName}`
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
