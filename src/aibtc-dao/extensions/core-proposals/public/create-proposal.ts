import {
  AnchorMode,
  broadcastTransaction,
  makeContractCall,
  principalCV,
  SignedContractCallOptions,
  TxBroadcastResult,
} from "@stacks/transactions";
import {
  CONFIG,
  deriveChildAccount,
  getNetwork,
  getNextNonce,
  sendToLLM,
  ToolResponse,
} from "../../../../utilities";

// creates a new core proposal
async function main() {
  const [
    daoCoreProposalsExtensionContractAddress,
    daoCoreProposalsExtensionContractName,
  ] = process.argv[2]?.split(".") || [];
  const [daoProposalContractAddress, daoProposalContractName] =
    process.argv[3]?.split(".") || [];

  if (
    !daoCoreProposalsExtensionContractAddress ||
    !daoCoreProposalsExtensionContractName ||
    !daoProposalContractAddress ||
    !daoProposalContractName
  ) {
    console.log(
      "Usage: bun run create-proposal.ts <daoCoreProposalsExtensionContract> <daoCoreProposalContract>"
    );
    console.log(
      "- e.g. bun run create-proposal.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.wed-core-proposals-v2 ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.wed-onchain-messaging-send"
    );

    process.exit(1);
  }

  const networkObj = getNetwork(CONFIG.NETWORK);
  const { address, key } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );

  const nextPossibleNonce = await getNextNonce(CONFIG.NETWORK, address);
  const txOptions: SignedContractCallOptions = {
    anchorMode: AnchorMode.Any,
    contractAddress: daoCoreProposalsExtensionContractAddress,
    contractName: daoCoreProposalsExtensionContractName,
    functionName: "create-proposal",
    functionArgs: [principalCV(daoProposalContractAddress)],
    network: networkObj,
    nonce: nextPossibleNonce,
    senderKey: key,
  };
  const transaction = await makeContractCall(txOptions);
  const broadcastResponse = await broadcastTransaction(transaction, networkObj);

  const response: ToolResponse<TxBroadcastResult> = {
    success: true,
    message: `Core proposal created successfully: 0x${broadcastResponse.txid}`,
    data: broadcastResponse,
  };
  return response;
}

main()
  .then((response) => {
    sendToLLM(response);
    process.exit(0);
  })
  .catch((error) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorData = error instanceof Error ? error : undefined;
    const response: ToolResponse<Error | undefined> = {
      success: false,
      message: errorMessage,
      data: errorData,
    };
    sendToLLM(response);
    process.exit(1);
  });
