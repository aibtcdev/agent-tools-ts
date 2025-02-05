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
import { dao } from "../../..";

// concludes a core proposal
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
      "Usage: bun run conclude-proposal.ts <daoCoreProposalsExtensionContract> <daoProposalContract>"
    );
    console.log(
      "- e.g. bun run conclude-proposal.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.wed-core-proposals ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.wed-onchain-messaging-send"
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
    contractAddress: daoCoreProposalsExtensionContractAddress,
    contractName: daoCoreProposalsExtensionContractName,
    functionName: "conclude-proposal",
    functionArgs: [principalCV(daoProposalContractAddress)],
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
