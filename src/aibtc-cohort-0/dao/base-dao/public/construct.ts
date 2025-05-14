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
  isValidContractPrincipal,
  sendToLLM,
  ToolResponse,
} from "../../../../utilities";

const usage =
  "Usage: bun run construct.ts <baseDaoContract> <proposalContract>";
const usageExample =
  "Example: bun run construct.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-base-dao ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-base-bootstrap-initialization-v2";

interface ExpectedArgs {
  baseDaoContract: string;
  proposalContract: string;
}

function validateArgs(): ExpectedArgs {
  const [baseDaoContract, proposalContract] = process.argv.slice(2);
  if (!isValidContractPrincipal(baseDaoContract)) {
    const errorMessage = [
      `Invalid base DAO contract address: ${baseDaoContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  if (!isValidContractPrincipal(proposalContract)) {
    const errorMessage = [
      `Invalid proposal contract address: ${proposalContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  return {
    baseDaoContract,
    proposalContract,
  };
}

async function main(): Promise<ToolResponse<TxBroadcastResult>> {
  const args = validateArgs();
  const [baseDaoAddress, baseDaoName] = args.baseDaoContract.split(".");

  const networkObj = getNetwork(CONFIG.NETWORK);
  const { address, key } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  const nextPossibleNonce = await getNextNonce(CONFIG.NETWORK, address);

  const txOptions: SignedContractCallOptions = {
    contractAddress: baseDaoAddress,
    contractName: baseDaoName,
    functionName: "construct",
    functionArgs: [Cl.principal(args.proposalContract)],
    network: networkObj,
    nonce: nextPossibleNonce,
    senderKey: key,
  };
  
  try {
    const transaction = await makeContractCall(txOptions);
    const broadcastResponse = await broadcastTx(transaction, networkObj);
    return {
      success: true,
      data: broadcastResponse,
      message: `Successfully constructed DAO with proposal ${args.proposalContract}`,
    };
  } catch (error) {
    const errorMessage = [
      `Error constructing DAO:`,
      `${error instanceof Error ? error.message : String(error)}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
