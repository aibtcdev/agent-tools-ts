import {
  AnchorMode,
  makeContractCall,
  Pc,
  PostConditionMode,
  principalCV,
  SignedContractCallOptions,
  noneCV,
  someCV,
  stringAsciiCV,
} from "@stacks/transactions";
import {
  broadcastTx,
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  getCurrentBondProposalAmount,
  getNetwork,
  getNextNonce,
  isValidContractPrincipal,
  sendToLLM,
} from "../../../../utilities";

const usage =
  "Usage: bun run create-proposal.ts <daoCoreProposalsExtensionContract> <daoCoreProposalContract> <daoTokenContract> [memo]";
const usageExample =
  'Example: bun run create-proposal.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-core-proposals-v2 ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-onchain-messaging-send ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-token "This is a proposal to add messaging"';

interface ExpectedArgs {
  daoCoreProposalsExtensionContract: string;
  daoProposalContract: string;
  daoTokenContract: string;
  memo?: string;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [
    daoCoreProposalsExtensionContract,
    daoProposalContract,
    daoTokenContract,
    memo,
  ] = process.argv.slice(2);
  if (
    !daoCoreProposalsExtensionContract ||
    !daoProposalContract ||
    !daoTokenContract
  ) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // verify contract addresses extracted from arguments
  if (!isValidContractPrincipal(daoCoreProposalsExtensionContract)) {
    const errorMessage = [
      `Invalid contract address: ${daoCoreProposalsExtensionContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  if (!isValidContractPrincipal(daoProposalContract)) {
    const errorMessage = [
      `Invalid contract address: ${daoProposalContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  if (!isValidContractPrincipal(daoTokenContract)) {
    const errorMessage = [
      `Invalid contract address: ${daoTokenContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // return validated arguments
  return {
    daoCoreProposalsExtensionContract,
    daoProposalContract,
    daoTokenContract,
    memo: memo || undefined,
  };
}

// creates a new core proposal
async function main() {
  // validate and store provided args
  const args = validateArgs();
  const [extensionAddress, extensionName] =
    args.daoCoreProposalsExtensionContract.split(".");
  const [tokenAddress, tokenName] = args.daoTokenContract.split(".");
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
    args.daoCoreProposalsExtensionContract,
    args.daoTokenContract,
    address
  );
  // configure post conditions
  const postConditions = [
    Pc.principal(address)
      .willSendEq(bondAmountInfo.bond.toString())
      .ft(`${tokenAddress}.${tokenName}`, bondAmountInfo.assetName),
  ];
  // configure contract call options
  const txOptions: SignedContractCallOptions = {
    contractAddress: extensionAddress,
    contractName: extensionName,
    functionName: "create-proposal",
    functionArgs: [
      principalCV(args.daoProposalContract),
      args.memo ? someCV(stringAsciiCV(args.memo)) : noneCV(),
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
