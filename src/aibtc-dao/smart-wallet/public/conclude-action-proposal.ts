import {
  AnchorMode,
  Cl,
  makeContractCall,
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
  isValidContractPrincipal,
  sendToLLM,
} from "../../../utilities";

const usage =
  "Usage: bun run conclude-action-proposal.ts <smartWalletContract> <daoActionProposalsExtensionContract> <proposalId> <daoActionProposalContract> <daoTokenContract>";
const usageExample =
  "Example: bun run conclude-action-proposal.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-user-agent-smart-wallet ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-action-proposals-v2 1 ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-action-send-message ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-token";

interface ExpectedArgs {
  smartWalletContract: string;
  daoActionProposalsExtensionContract: string;
  proposalId: number;
  daoActionProposalContract: string;
  daoTokenContract: string;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [
    smartWalletContract,
    actionProposalsExtension,
    proposalIdStr,
    actionContract,
    tokenContract,
  ] = process.argv.slice(2);
  const proposalId = parseInt(proposalIdStr);
  if (
    !smartWalletContract ||
    !actionProposalsExtension ||
    !proposalId ||
    !actionContract ||
    !tokenContract
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
  if (!isValidContractPrincipal(actionProposalsExtension)) {
    const errorMessage = [
      `Invalid contract address: ${actionProposalsExtension}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  if (!isValidContractPrincipal(actionContract)) {
    const errorMessage = [
      `Invalid contract address: ${actionContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  if (!isValidContractPrincipal(tokenContract)) {
    const errorMessage = [
      `Invalid contract address: ${tokenContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  // return validated arguments
  return {
    smartWalletContract,
    daoActionProposalsExtensionContract: actionProposalsExtension,
    proposalId,
    daoActionProposalContract: actionContract,
    daoTokenContract: tokenContract,
  };
}

// concludes an action proposal through a smart wallet
async function main() {
  // validate and store provided args
  const args = validateArgs();
  const [smartWalletAddress, smartWalletName] =
    args.smartWalletContract.split(".");

  // setup network and wallet info
  const networkObj = getNetwork(CONFIG.NETWORK);
  const { address, key } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  const nextPossibleNonce = await getNextNonce(CONFIG.NETWORK, address);

  // configure contract call options
  const txOptions: SignedContractCallOptions = {
    anchorMode: AnchorMode.Any,
    contractAddress: smartWalletAddress,
    contractName: smartWalletName,
    functionName: "conclude-action-proposal",
    functionArgs: [
      Cl.principal(args.daoActionProposalsExtensionContract),
      Cl.uint(args.proposalId),
      Cl.principal(args.daoActionProposalContract),
    ],
    network: networkObj,
    nonce: nextPossibleNonce,
    senderKey: key,
    postConditionMode: PostConditionMode.Allow,
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
