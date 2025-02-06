import {
  AnchorMode,
  Cl,
  makeContractCall,
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
  "Usage: bun run vote-on-proposal.ts <daoActionProposalsExtensionContract> <proposalId> <vote>";
const usageExample =
  'Example: bun run vote-on-proposal.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.wed-action-proposals 1 true';

interface ExpectedArgs {
  daoActionProposalsExtensionContract: string;
  proposalId: number;
  vote: boolean;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [
    daoActionProposalsExtensionContract,
    proposalIdStr,
    voteStr,
  ] = process.argv.slice(2);
  const proposalId = parseInt(proposalIdStr);
  const vote = convertStringToBoolean(voteStr);
  if (
    !daoActionProposalsExtensionContract ||
    !proposalId ||
    vote === undefined
  ) {
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
  const [extensionAddress, extensionName] =
    daoActionProposalsExtensionContract.split(".");
  if (!extensionAddress || !extensionName) {
    const errorMessage = [
      `Invalid contract address: ${daoActionProposalsExtensionContract}`,
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
    daoActionProposalsExtensionContract,
    proposalId,
    vote,
  };
}

// votes on an action proposal
async function main() {
  // validate and store provided args
  const args = validateArgs();
  const [extensionAddress, extensionName] =
    args.daoActionProposalsExtensionContract.split(".");
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
    functionArgs: [
      Cl.uint(args.proposalId),
      Cl.bool(args.vote),
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
