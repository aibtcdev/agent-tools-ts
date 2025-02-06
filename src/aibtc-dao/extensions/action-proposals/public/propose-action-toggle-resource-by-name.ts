import {
  AnchorMode,
  Cl,
  makeContractCall,
  SignedContractCallOptions,
} from "@stacks/transactions";
import {
  broadcastTx,
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  getNetwork,
  getNextNonce,
  sendToLLM,
} from "../../../../utilities";

const usage =
  "Usage: bun run propose-action-toggle-resource-by-name.ts <daoActionProposalsExtensionContract> <daoActionProposalContract> <resourceName>";
const usageExample =
  'Example: bun run propose-action-toggle-resource-by-name.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtcdao-action-proposals-v2 ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtcdao-action-toggle-resource-by-name "consulting"';

interface ExpectedArgs {
  daoActionProposalsExtensionContract: string;
  daoActionProposalContract: string;
  resourceName: string;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [
    daoActionProposalsExtensionContract,
    daoActionProposalContract,
    resourceName,
  ] = process.argv.slice(2);
  if (
    !daoActionProposalsExtensionContract ||
    !daoActionProposalContract ||
    !resourceName
  ) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // verify contract addresses extracted from arguments
  const [extensionAddress, extensionName] =
    daoActionProposalsExtensionContract.split(".");
  const [actionAddress, actionName] = daoActionProposalContract.split(".");
  if (!extensionAddress || !extensionName || !actionAddress || !actionName) {
    const errorMessage = [
      `Invalid contract addresses: ${daoActionProposalsExtensionContract} ${daoActionProposalContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // return validated arguments
  return {
    daoActionProposalsExtensionContract,
    daoActionProposalContract,
    resourceName,
  };
}

// creates a new action proposal
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
  // configure contract call parameters
  const paramsCV = Cl.stringAscii(args.resourceName);
  // configure contract call options
  const txOptions: SignedContractCallOptions = {
    anchorMode: AnchorMode.Any,
    contractAddress: extensionAddress,
    contractName: extensionName,
    functionName: "propose-action",
    functionArgs: [
      Cl.principal(args.daoActionProposalContract),
      Cl.buffer(Cl.serialize(paramsCV)),
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
