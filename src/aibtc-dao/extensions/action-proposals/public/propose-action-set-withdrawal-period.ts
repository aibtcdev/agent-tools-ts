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
  "Usage: bun run propose-action-set-withdrawal-period.ts <daoActionProposalsExtensionContract> <daoActionProposalContract> <daoTokenContract> <withdrawalPeriod> [memo]";
const usageExample =
  'Example: bun run propose-action-set-withdrawal-period.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-action-proposals-v2 ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-action-set-withdrawal-period ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-token 50 "Change withdrawal period"';

interface ExpectedArgs {
  daoActionProposalsExtensionContract: string;
  daoActionProposalContract: string;
  daoTokenContract: string;
  withdrawalPeriod: number;
  memo?: string;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [
    daoActionProposalsExtensionContract,
    daoActionProposalContract,
    daoTokenContract,
    withdrawalPeriodStr,
    memo,
  ] = process.argv.slice(2);
  const withdrawalPeriod = parseInt(withdrawalPeriodStr);
  if (
    !daoActionProposalsExtensionContract ||
    !daoActionProposalContract ||
    !daoTokenContract ||
    !withdrawalPeriod
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
  const [tokenAddress, tokenName] = daoTokenContract.split(".");
  if (
    !extensionAddress ||
    !extensionName ||
    !actionAddress ||
    !actionName ||
    !tokenAddress ||
    !tokenName
  ) {
    const errorMessage = [
      `Invalid contract addresses: ${daoActionProposalsExtensionContract} ${daoActionProposalContract} ${daoTokenContract}`,
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
    withdrawalPeriod,
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
  const paramsCV = Cl.uint(args.withdrawalPeriod);
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
