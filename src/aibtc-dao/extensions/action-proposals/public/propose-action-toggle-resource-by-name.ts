import {
  AnchorMode,
  broadcastTransaction,
  Cl,
  getAddressFromPrivateKey,
  makeContractCall,
  SignedContractCallOptions,
} from "@stacks/transactions";
import {
  CONFIG,
  deriveChildAccount,
  getNetwork,
  getNextNonce,
} from "../../../../utilities";

// creates a new action proposal
async function main() {
  const [
    daoActionProposalsExtensionContractAddress,
    daoActionProposalsExtensionContractName,
  ] = process.argv[2]?.split(".") || [];
  const daoActionProposalContractAddress = process.argv[3];
  const resourceName = process.argv[4];

  if (
    !daoActionProposalsExtensionContractAddress ||
    !daoActionProposalsExtensionContractName ||
    !daoActionProposalContractAddress ||
    !resourceName
  ) {
    console.log(
      "Usage: bun run propose-action-toggle-resource-by-name.ts <daoActionProposalsExtensionContract> <daoActionProposalContract> <resourceName>"
    );
    console.log(
      '- e.g. bun run propose-action-toggle-resource-by-name.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.wed-action-proposals ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.wed-action-toggle-resource-by-name "consulting"'
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

  const paramsCV = Cl.stringAscii(resourceName);

  const txOptions: SignedContractCallOptions = {
    anchorMode: AnchorMode.Any,
    contractAddress: daoActionProposalsExtensionContractAddress,
    contractName: daoActionProposalsExtensionContractName,
    functionName: "propose-action",
    functionArgs: [
      Cl.principal(daoActionProposalContractAddress),
      Cl.buffer(Cl.serialize(paramsCV)),
    ],
    network: networkObj,
    nonce: nextPossibleNonce,
    senderKey: key,
  };

  const transaction = await makeContractCall(txOptions);
  const broadcastResponse = await broadcastTransaction(transaction, networkObj);

  console.log(`Proposal created successfully: 0x${broadcastResponse.txid}`);
  console.log(`Full response: ${JSON.stringify(broadcastResponse, null, 2)}`);
}

main().catch((error) => {
  error instanceof Error
    ? console.error(JSON.stringify({ success: false, message: error.message }))
    : console.error(JSON.stringify({ success: false, message: String(error) }));

  process.exit(1);
});
