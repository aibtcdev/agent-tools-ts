import {
  AnchorMode,
  broadcastTransaction,
  getAddressFromPrivateKey,
  makeContractCall,
  principalCV,
  SignedContractCallOptions,
} from "@stacks/transactions";
import {
  CONFIG,
  deriveChildAccount,
  getNetwork,
  getNextNonce,
} from "../../../utilities";

// concludes a core proposal
async function main() {
  const [daoCoreContractExtensionAddress, daoCoreContractExtensionName] =
    process.argv[2]?.split(".") || [];
  const [proposalContractAddress, proposalContractName] =
    process.argv[3]?.split(".") || [];
  const [treasuryContractAddress, treasuryContractName] =
    process.argv[4]?.split(".") || [];

  if (
    !daoCoreContractExtensionAddress ||
    !daoCoreContractExtensionName ||
    !proposalContractAddress ||
    !proposalContractName ||
    !treasuryContractAddress ||
    !treasuryContractName
  ) {
    console.log(
      "Usage: bun run conclude-proposal.ts <daoCoreProposalExtensionContract> <newProposalContract> <daoTreasuryContract>"
    );
    console.log(
      "- e.g. bun run conclude-proposal.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.wed-core-proposals ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.wed-base-bootstrap-initialization ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.wed-treasury"
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
    contractAddress: daoCoreContractExtensionAddress,
    contractName: daoCoreContractExtensionName,
    functionName: "vote-on-proposal",
    functionArgs: [
      principalCV(proposalContractAddress),
      principalCV(treasuryContractAddress),
    ],
    network: networkObj,
    nonce: nextPossibleNonce,
    senderKey: key,
  };

  const transaction = await makeContractCall(txOptions);
  const broadcastResponse = await broadcastTransaction(transaction, networkObj);

  console.log(`Proposal concluded successfully: 0x${broadcastResponse.txid}`);
  console.log(`Full response: ${JSON.stringify(broadcastResponse, null, 2)}`);
}

main().catch((error) => {
  error instanceof Error
    ? console.error(JSON.stringify({ success: false, message: error.message }))
    : console.error(JSON.stringify({ success: false, message: String(error) }));

  process.exit(1);
});
