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
  "Usage: bun run propose-action-allow-asset.ts <daoActionProposalsExtensionContract> <daoActionProposalContract> <tokenContractAddress>";
const usageExample =
  "Example: bun run propose-action-allow-asset.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.wed-action-proposals-v2 ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.wed-action-allow-asset ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.shiny-new-token";

interface ExpectedArgs {
  daoActionProposalsExtensionContract: string;
  daoActionProposalContract: string;
  tokenContractAddress: string;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [
    daoActionProposalsExtensionContract,
    daoActionProposalContract,
    tokenContractAddress,
  ] = process.argv.slice(2);
  if (
    !daoActionProposalsExtensionContract ||
    !daoActionProposalContract ||
    !tokenContractAddress
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
  const [actionAddress, actionName] = daoActionProposalContract.split(".");
  const [tokenAddress] = tokenContractAddress.split(".");
  if (
    !extensionAddress ||
    !extensionName ||
    !actionAddress ||
    !actionName ||
    !tokenAddress
  ) {
    const errorMessage = [
      `Invalid contract addresses: ${daoActionProposalsExtensionContract} ${daoActionProposalContract} ${tokenContractAddress}`,
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
    daoActionProposalsExtensionContract: daoActionProposalsExtensionContract,
    daoActionProposalContract: daoActionProposalContract,
    tokenContractAddress: tokenContractAddress,
  };
}

// creates a new action proposal
async function main() {
  // validate and store provided args
  const args = validateArgs();
  const [extensionAddress, extensionName] =
    args.daoActionProposalsExtensionContract.split(".");
  // setup netwokr and wallet info
  const networkObj = getNetwork(CONFIG.NETWORK);
  const { address, key } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  const nextPossibleNonce = await getNextNonce(CONFIG.NETWORK, address);
  // configure contract call parameters
  const paramsCV = Cl.principal(args.tokenContractAddress);
  // configure contract call options
  const txOptions: SignedContractCallOptions = {
    anchorMode: AnchorMode.Any,
    contractAddress: extensionAddress,
    contractName: extensionAddress,
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
