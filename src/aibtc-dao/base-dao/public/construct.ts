import {
  AnchorMode,
  Cl,
  makeContractCall,
  SignedContractCallOptions,
  TxBroadcastResult,
} from "@stacks/transactions";
import {
  broadcastTx,
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  getNetwork,
  getNextNonce,
  sendToLLM,
  ToolResponse,
} from "../../../utilities";

const usage =
  "Usage: bun run construct.ts <baseDaoContract> <proposalContract>";
const usageExample =
  "Example: bun run construct.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-base-dao ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-base-bootstrap-initialization-v2";

interface ExpectedArgs {
  baseDaoContract: string;
  proposalContract: string;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [baseDaoContract, proposalContract] = process.argv.slice(2);
  if (!baseDaoContract || !proposalContract) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // verify contract addresses extracted from arguments
  const [daoAddress, daoName] = baseDaoContract.split(".");
  const [proposalAddress, proposalName] = proposalContract.split(".");
  if (!daoAddress || !daoName || !proposalAddress || !proposalName) {
    const errorMessage = [
      `Invalid contract addresses: ${baseDaoContract} ${proposalContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // return validated arguments
  return {
    baseDaoContract,
    proposalContract,
  };
}

async function main(): Promise<ToolResponse<TxBroadcastResult>> {
  // validate and store provided args
  const args = validateArgs();
  const [baseDaoAddress, baseDaoName] = args.baseDaoContract.split(".");

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
    contractAddress: baseDaoAddress,
    contractName: baseDaoName,
    functionName: "construct",
    functionArgs: [Cl.principal(args.proposalContract)],
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
