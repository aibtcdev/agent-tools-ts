import {
  AnchorMode,
  Cl,
  makeContractCall,
  Pc,
  PostConditionMode,
  SignedContractCallOptions,
} from "@stacks/transactions";
import {
  broadcastTx,
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  getNetwork,
  getNextNonce,
  getCurrentBondProposalAmount,
  sendToLLM,
} from "../../../../utilities";

const usage =
  "Usage: bun run propose-action-add-resource.ts <daoActionProposalsExtensionContract> <daoActionProposalContract> <daoTokenAddress> <resourceName> <resourceDescription> <resourcePrice> <resourceUrl>";
const usageExample =
  'Example: bun run propose-action-add-resource.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-action-proposals-v2 ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-action-add-resource ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-token "consultation" "consult with me for 1hr" 100000000 "https://aibtc.dev"';

interface ExpectedArgs {
  daoActionProposalsExtensionContract: string;
  daoActionProposalContract: string;
  daoTokenContract: string;
  resourceName: string;
  resourceDescription: string;
  resourcePrice: number;
  resourceUrl: string;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [
    daoActionProposalsExtensionContract,
    daoActionProposalContract,
    daoTokenContract,
    resourceName,
    resourceDescription,
    resourcePriceStr,
    resourceUrl,
  ] = process.argv.slice(2);
  const resourcePrice = parseInt(resourcePriceStr);
  if (
    !daoActionProposalsExtensionContract ||
    !daoActionProposalContract ||
    !daoTokenContract ||
    !resourceName ||
    !resourceDescription ||
    !resourcePrice
  ) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // verify contract addresses extracted from arguments
  const [extensionAddress, extensionName] =
    daoActionProposalsExtensionContract.split(".");
  const [actionAddress, actionName] = daoActionProposalContract.split(".");
  if (!extensionAddress || !extensionName || !actionAddress || !actionName) {
    const errorMessage = [
      `Invalid contract addresses: ${daoActionProposalsExtensionContract} ${daoActionProposalContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // return validated arguments
  return {
    daoActionProposalsExtensionContract,
    daoActionProposalContract,
    daoTokenContract,
    resourceName,
    resourceDescription,
    resourcePrice,
    resourceUrl,
  };
}

// creates a new action proposal
async function main() {
  // validate and store provided args
  const args = validateArgs();
  const [extensionAddress, extensionName] =
    args.daoActionProposalsExtensionContract.split(".");
  const [daoTokenAddress, daoTokenName] = args.daoTokenContract.split(".");
  // setup network and wallet info
  const networkObj = getNetwork(CONFIG.NETWORK);
  const { address, key } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  const nextPossibleNonce = await getNextNonce(CONFIG.NETWORK, address);
  // get the proposal bond amount from the contract
  const bondAmountInfo = await getCurrentBondProposalAmount(
    args.daoActionProposalsExtensionContract,
    address
  );
  // configure post conditions
  const postConditions = [
    Pc.principal(address)
      .willSendEq(bondAmountInfo.bond)
      .ft(`${daoTokenAddress}.${daoTokenName}`, bondAmountInfo.tokenName),
  ];
  // configure contract call parameters
  const paramsCV = Cl.tuple({
    name: Cl.stringUtf8(args.resourceName),
    description: Cl.stringUtf8(args.resourceDescription),
    price: Cl.uint(args.resourcePrice),
    url: args.resourceUrl ? Cl.stringUtf8(args.resourceUrl) : Cl.none(),
  });
  // configure contract call options
  const txOptions: SignedContractCallOptions = {
    anchorMode: AnchorMode.Any,
    contractAddress: extensionAddress,
    contractName: extensionName,
    functionName: "propose-action",
    functionArgs: [
      Cl.principal(args.daoActionProposalContract),
      Cl.buffer(Cl.serialize(paramsCV)),
    ],
    network: networkObj,
    nonce: nextPossibleNonce,
    senderKey: key,
    postConditionMode: PostConditionMode.Deny,
    postConditions: postConditions,
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
