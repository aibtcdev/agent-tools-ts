import {
  AnchorMode,
  boolCV,
  broadcastTransaction,
  getAddressFromPrivateKey,
  makeContractCall,
  SignedContractCallOptions,
  uintCV,
} from "@stacks/transactions";
import {
  CONFIG,
  convertStringToBoolean,
  deriveChildAccount,
  getNetwork,
  getNextNonce,
} from "../../../../utilities";

// votes on an action proposal
async function main() {
  // contract for the action extension in the dao
  const [
    daoActionProposalsExtensionContractAddress,
    daoActionProposalsExtensionContractName,
  ] = process.argv[2]?.split(".") || [];
  // proposal id to be concluded
  const proposalId = parseInt(process.argv[3]);
  // action contract in the dao to be executed / concluded
  const vote = convertStringToBoolean(process.argv[4]);

  if (
    !daoActionProposalsExtensionContractAddress ||
    !daoActionProposalsExtensionContractName ||
    !proposalId ||
    !vote
  ) {
    console.log(
      "Usage: bun run vote-on-proposal.ts <daoActionProposalsExtensionContract> <proposalId> <vote>"
    );
    console.log(
      "- e.g. bun run vote-on-proposal.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.wed-action-proposals 1 true"
    );

    process.exit(1);
  }

  const networkObj = getNetwork(CONFIG.NETWORK);
  const { key } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  const senderAddress = getAddressFromPrivateKey(key, networkObj.version);
  const nextPossibleNonce = await getNextNonce(CONFIG.NETWORK, senderAddress);

  const txOptions: SignedContractCallOptions = {
    anchorMode: AnchorMode.Any,
    contractAddress: daoActionProposalsExtensionContractAddress,
    contractName: daoActionProposalsExtensionContractName,
    functionName: "vote-on-proposal",
    functionArgs: [uintCV(proposalId), boolCV(vote)],
    network: networkObj,
    nonce: nextPossibleNonce,
    senderKey: key,
  };

  const transaction = await makeContractCall(txOptions);
  const broadcastResponse = await broadcastTransaction(transaction, networkObj);

  console.log(`Proposal vote sent successfully: 0x${broadcastResponse.txid}`);
  console.log(`Full response: ${JSON.stringify(broadcastResponse, null, 2)}`);
}

main().catch((error) => {
  error instanceof Error
    ? console.error(JSON.stringify({ success: false, message: error.message }))
    : console.error(JSON.stringify({ success: false, message: String(error) }));

  process.exit(1);
});
