import {
  AnchorMode,
  broadcastTransaction,
  makeContractCall,
  principalCV,
  SignedContractCallOptions,
  TxBroadcastResult,
  uintCV,
} from "@stacks/transactions";
import {
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  getNetwork,
  getNextNonce,
  sendToLLM,
  ToolResponse,
} from "../../../../utilities";

const usage =
  "Usage: bun run conclude-proposal.ts <daoActionProposalsExtensionContract> <proposalId> <daoActionProposalContract>";
const usageExample =
  "Example: bun run conclude-proposal.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.wed-action-proposals-v2 1 ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.wed-action-send-message";

interface ProposalArgs {
  daoActionProposalsExtensionContract: string;
  proposalId: number;
  daoActionProposalContract: string;
}

function validateArgs(): ProposalArgs {
  // verify all required arguments are provided
  const [actionProposalsExtension, proposalIdStr, actionContract] =
    process.argv.slice(2);
  const proposalId = parseInt(proposalIdStr);
  if (!actionProposalsExtension || !proposalId || !actionContract) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    sendToLLM({
      success: false,
      message: errorMessage,
    });
    process.exit(1);
  }
  // verify contract addresses extracted from arguments
  const [extensionAddress, extensionName] = actionProposalsExtension.split(".");
  const [actionAddress, actionName] = actionContract.split(".");
  if (!extensionAddress || !extensionName || !actionAddress || !actionName) {
    const errorMessage = [
      `Invalid contract addresses: ${actionProposalsExtension} ${actionContract}`,
      usage,
      usageExample,
    ].join("\n");
    sendToLLM({
      success: false,
      message: errorMessage,
    });
    process.exit(1);
  }
  // return validated arguments
  return {
    daoActionProposalsExtensionContract: actionProposalsExtension,
    proposalId,
    daoActionProposalContract: actionContract,
  };
}

// concludes an action proposal
async function main() {
  // validate and store provided args
  const args = validateArgs();
  const [extensionAddress, extensionName] =
    args.daoActionProposalsExtensionContract.split(".");

  const networkObj = getNetwork(CONFIG.NETWORK);
  const { address, key } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );

  const nextPossibleNonce = await getNextNonce(CONFIG.NETWORK, address);
  const txOptions: SignedContractCallOptions = {
    anchorMode: AnchorMode.Any,
    contractAddress: extensionAddress,
    contractName: extensionName,
    functionName: "conclude-proposal",
    functionArgs: [
      uintCV(args.proposalId),
      principalCV(args.daoActionProposalContract),
    ],
    network: networkObj,
    nonce: nextPossibleNonce,
    senderKey: key,
  };
  const transaction = await makeContractCall(txOptions);
  const broadcastResponse = await broadcastTransaction(transaction, networkObj);

  const response: ToolResponse<TxBroadcastResult> = {
    success: true,
    message: `Action proposal concluded successfully: 0x${broadcastResponse.txid}`,
    data: broadcastResponse,
  };
  return response;
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
