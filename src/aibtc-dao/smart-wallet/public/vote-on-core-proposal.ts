import {
  AnchorMode,
  boolCV,
  makeContractCall,
  principalCV,
  SignedContractCallOptions,
} from "@stacks/transactions";
import {
  broadcastTx,
  CONFIG,
  convertStringToBoolean,
  createErrorResponse,
  deriveChildAccount,
  getNetwork,
  getNextNonce,
  sendToLLM,
} from "../../../utilities";

const usage =
  "Usage: bun run vote-on-core-proposal.ts <smartWalletContract> <daoCoreProposalsExtensionContract> <daoProposalContract> <vote>";
const usageExample =
  "Example: bun run vote-on-core-proposal.ts ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-user-agent-smart-wallet ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-core-proposals-v2 ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-onchain-messaging-send true";

interface ExpectedArgs {
  smartWalletContract: string;
  daoCoreProposalsExtensionContract: string;
  daoProposalContract: string;
  vote: boolean;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [
    smartWalletContract,
    coreProposalsExtension,
    proposalContract,
    voteStr,
  ] = process.argv.slice(2);
  const vote = convertStringToBoolean(voteStr);
  if (
    !smartWalletContract ||
    !coreProposalsExtension ||
    !proposalContract ||
    vote === undefined
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
  const [extensionAddress, extensionName] = coreProposalsExtension.split(".");
  const [proposalAddress, proposalName] = proposalContract.split(".");
  if (
    !walletAddress ||
    !walletName ||
    !extensionAddress ||
    !extensionName ||
    !proposalAddress ||
    !proposalName
  ) {
    const errorMessage = [
      `Invalid contract addresses: ${smartWalletContract} ${coreProposalsExtension} ${proposalContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // return validated arguments
  return {
    smartWalletContract,
    daoCoreProposalsExtensionContract: coreProposalsExtension,
    daoProposalContract: proposalContract,
    vote,
  };
}

// votes on a core proposal through a smart wallet
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
  // configure contract call options
  const txOptions: SignedContractCallOptions = {
    anchorMode: AnchorMode.Any,
    contractAddress: walletAddress,
    contractName: walletName,
    functionName: "vote-on-core-proposal",
    functionArgs: [
      principalCV(args.daoCoreProposalsExtensionContract),
      principalCV(args.daoProposalContract),
      boolCV(args.vote),
    ],
    network: networkObj,
    nonce: nextPossibleNonce,
    senderKey: key,
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
