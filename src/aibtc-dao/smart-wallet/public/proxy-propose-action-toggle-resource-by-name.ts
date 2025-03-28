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
  getCurrentBondProposalAmount,
  getNetwork,
  getNextNonce,
  isValidContractPrincipal,
  sendToLLM,
} from "../../../utilities";

const usage =
  "Usage: bun run proxy-propose-action-toggle-resource-by-name.ts <smartWalletContract> <daoActionProposalsExtensionContract> <daoActionProposalContract> <daoTokenContract> <resourceName>";
const usageExample =
  'Example: bun run proxy-propose-action-toggle-resource-by-name.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-user-agent-smart-wallet ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-action-proposals-v2 ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-action-toggle-resource-by-name ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-token "consulting"';

interface ExpectedArgs {
  smartWalletContract: string;
  daoActionProposalsExtensionContract: string;
  daoActionProposalContract: string;
  daoTokenContract: string;
  resourceName: string;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [
    smartWalletContract,
    daoActionProposalsExtensionContract,
    daoActionProposalContract,
    daoTokenContract,
    resourceName,
  ] = process.argv.slice(2);
  if (
    !smartWalletContract ||
    !daoActionProposalsExtensionContract ||
    !daoActionProposalContract ||
    !daoTokenContract ||
    !resourceName
  ) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // verify contract addresses extracted from arguments
  if (!isValidContractPrincipal(smartWalletContract)) {
    const errorMessage = [
      `Invalid contract address: ${smartWalletContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  if (!isValidContractPrincipal(daoActionProposalsExtensionContract)) {
    const errorMessage = [
      `Invalid contract address: ${daoActionProposalsExtensionContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  if (!isValidContractPrincipal(daoActionProposalContract)) {
    const errorMessage = [
      `Invalid contract address: ${daoActionProposalContract}`,
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
    smartWalletContract,
    daoActionProposalsExtensionContract,
    daoActionProposalContract,
    daoTokenContract,
    resourceName,
  };
}

// creates a new action proposal through a smart wallet
async function main() {
  // validate and store provided args
  const args = validateArgs();
  const [walletAddress, walletName] = args.smartWalletContract.split(".");
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
    Pc.principal(args.smartWalletContract)
      .willSendEq(bondAmountInfo.bond.toString())
      .ft(`${daoTokenAddress}.${daoTokenName}`, bondAmountInfo.assetName),
  ];
  // configure contract call parameters
  const paramsCV = Cl.stringAscii(args.resourceName);
  // configure contract call options
  const txOptions: SignedContractCallOptions = {
    anchorMode: AnchorMode.Any,
    contractAddress: walletAddress,
    contractName: walletName,
    functionName: "proxy-propose-action",
    functionArgs: [
      Cl.principal(args.daoActionProposalsExtensionContract),
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
