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
  "Usage: bun run propose-action-allow-asset.ts <daoActionProposalsExtensionContract> <daoActionProposalContract> <daoTokenContract> <tokenContractAddress> [memo]";
const usageExample =
  'Example: bun run propose-action-allow-asset.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-action-proposals-v2 ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-action-allow-asset ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-token ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.shiny-new-token "Allow new token asset"';

interface ExpectedArgs {
  daoActionProposalsExtensionContract: string;
  daoActionProposalContract: string;
  daoTokenContract: string;
  tokenContractAddress: string;
  memo?: string;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [
    daoActionProposalsExtensionContract,
    daoActionProposalContract,
    daoTokenContract,
    tokenContractAddress,
    memo,
  ] = process.argv.slice(2);
  if (
    !daoActionProposalsExtensionContract ||
    !daoActionProposalContract ||
    !daoTokenContract ||
    !tokenContractAddress
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
  const [daoTokenAddress, daoTokenName] = daoTokenContract.split(".");
  const [tokenAddress] = tokenContractAddress.split(".");
  if (
    !extensionAddress ||
    !extensionName ||
    !actionAddress ||
    !actionName ||
    !daoTokenAddress ||
    !daoTokenName ||
    !tokenAddress
  ) {
    const errorMessage = [
      `Invalid contract addresses: ${daoActionProposalsExtensionContract} ${daoActionProposalContract} ${daoTokenContract} ${tokenContractAddress}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // return validated arguments
  return {
    daoActionProposalsExtensionContract: daoActionProposalsExtensionContract,
    daoActionProposalContract: daoActionProposalContract,
    daoTokenContract: daoTokenContract,
    tokenContractAddress: tokenContractAddress,
    memo: memo || undefined,
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
    args.daoTokenContract,
    address
  );
  // configure post conditions
  const postConditions = [
    Pc.principal(address)
      .willSendEq(bondAmountInfo.bond.toString())
      .ft(`${daoTokenAddress}.${daoTokenName}`, bondAmountInfo.assetName),
  ];
  // configure contract call parameters
  const paramsCV = Cl.principal(args.tokenContractAddress);
  // configure contract call options
  const txOptions: SignedContractCallOptions = {
    contractAddress: extensionAddress,
    contractName: extensionName,
    functionName: "propose-action",
    functionArgs: [
      Cl.principal(args.daoActionProposalContract),
      Cl.bufferFromHex(Cl.serialize(paramsCV)),
      args.memo ? Cl.some(Cl.stringAscii(args.memo)) : Cl.none(),
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
