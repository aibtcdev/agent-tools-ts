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
} from "../../../../utilities";

const usage =
  "Usage: bun run vote-on-proposal.ts <daoCoreProposalsExtensionContract> <daoProposalContract> <vote>";
const usageExample =
  "Example: bun run vote-on-proposal.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtcdao-core-proposals-v2 ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtcdao-onchain-messaging-send true";

interface ExpectedArgs {
  daoCoreProposalsExtensionContract: string;
  daoProposalContract: string;
  vote: boolean;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [coreProposalsExtension, proposalContract, voteStr] =
    process.argv.slice(2);
  const vote = convertStringToBoolean(voteStr);
  if (!coreProposalsExtension || !proposalContract || !vote) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // verify contract addresses extracted from arguments
  const [extensionAddress, extensionName] = coreProposalsExtension.split(".");
  const [proposalAddress, proposalName] = proposalContract.split(".");
  if (
    !extensionAddress ||
    !extensionName ||
    !proposalAddress ||
    !proposalName
  ) {
    const errorMessage = [
      `Invalid contract addresses: ${coreProposalsExtension} ${proposalContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // return validated arguments
  return {
    daoCoreProposalsExtensionContract: coreProposalsExtension,
    daoProposalContract: proposalContract,
    vote,
  };
}

// votes on a core proposal
async function main() {
  // validate and store provided args
  const args = validateArgs();
  const [extensionAddress, extensionName] =
    args.daoCoreProposalsExtensionContract.split(".");
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
    contractAddress: extensionAddress,
    contractName: extensionName,
    functionName: "vote-on-proposal",
    functionArgs: [principalCV(args.daoProposalContract), boolCV(args.vote)],
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
