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
  sendToLLM,
} from "../../../utilities";

const usage =
  "Usage: bun run proxy-propose-action-set-withdrawal-amount.ts <smartWalletContract> <daoActionProposalsExtensionContract> <daoActionProposalContract> <daoTokenContract> <withdrawalAmount>";
const usageExample =
  "Example: bun run proxy-propose-action-set-withdrawal-amount.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-user-agent-smart-wallet ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-action-proposals-v2 ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-action-set-withdrawal-amount ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-token 50";

interface ExpectedArgs {
  smartWalletContract: string;
  daoActionProposalsExtensionContract: string;
  daoActionProposalContract: string;
  daoTokenContract: string;
  withdrawalAmount: number;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [
    smartWalletContract,
    daoActionProposalsExtensionContract,
    daoActionProposalContract,
    daoTokenContract,
    withdrawalAmountStr,
  ] = process.argv.slice(2);
  const withdrawalAmount = parseInt(withdrawalAmountStr);
  if (
    !smartWalletContract ||
    !daoActionProposalsExtensionContract ||
    !daoActionProposalContract ||
    !daoTokenContract ||
    !withdrawalAmount
  ) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // verify contract addresses extracted from arguments
  const [walletAddress, walletName] = smartWalletContract.split(".");
  const [extensionAddress, extensionName] =
    daoActionProposalsExtensionContract.split(".");
  const [actionAddress, actionName] = daoActionProposalContract.split(".");
  const [tokenAddress, tokenName] = daoTokenContract.split(".");
  if (
    !walletAddress ||
    !walletName ||
    !extensionAddress ||
    !extensionName ||
    !actionAddress ||
    !actionName ||
    !tokenAddress ||
    !tokenName
  ) {
    const errorMessage = [
      `Invalid contract addresses: ${smartWalletContract} ${daoActionProposalsExtensionContract} ${daoActionProposalContract} ${daoTokenContract}`,
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
    withdrawalAmount,
  };
}

// creates a new action proposal through a smart wallet
async function main() {
  // validate and store provided args
  const args = validateArgs();
  const [walletAddress, walletName] = args.smartWalletContract.split(".");
  // setup network and wallet info
  const networkObj = getNetwork(CONFIG.NETWORK);
  const { address, key } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  const nextPossibleNonce = await getNextNonce(CONFIG.NETWORK, address);
  // configure contract call parameters
  const paramsCV = Cl.uint(args.withdrawalAmount);
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
    postConditions: [],
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
