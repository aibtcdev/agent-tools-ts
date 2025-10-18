import {
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
  isValidContractPrincipal,
  sendToLLM,
  ToolResponse,
  TxBroadcastResultWithLink,
} from "../../../../../utilities";

const usage =
  "Usage: bun run set-dao-monarch.ts <daoCharterContract> <monarchPrincipal>";
const usageExample =
  "Example: bun run set-dao-monarch.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.dao-charter ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA";

interface ExpectedArgs {
  daoCharterContract: string;
  monarchPrincipal: string;
}

function validateArgs(): ExpectedArgs {
  const [daoCharterContract, monarchPrincipal] = process.argv.slice(2);
  if (!daoCharterContract || !monarchPrincipal) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  if (!isValidContractPrincipal(daoCharterContract)) {
    const errorMessage = [
      `Invalid DAO charter contract address: ${daoCharterContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  return {
    daoCharterContract,
    monarchPrincipal,
  };
}

async function main(): Promise<ToolResponse<TxBroadcastResultWithLink>> {
  const args = validateArgs();
  const [contractAddress, contractName] = args.daoCharterContract.split(".");

  const networkObj = getNetwork(CONFIG.NETWORK);
  const { address, key } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  const nextPossibleNonce = await getNextNonce(CONFIG.NETWORK, address);

  const txOptions: SignedContractCallOptions = {
    contractAddress,
    contractName,
    functionName: "set-dao-monarch",
    functionArgs: [Cl.principal(args.monarchPrincipal)],
    network: networkObj,
    nonce: nextPossibleNonce,
    senderKey: key,
  };

  try {
    const transaction = await makeContractCall(txOptions);
    const broadcastResponse = await broadcastTx(transaction, networkObj);
    return broadcastResponse;
  } catch (error) {
    const errorMessage = [
      `Error setting DAO monarch:`,
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
