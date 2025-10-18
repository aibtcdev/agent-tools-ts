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
} from "../../../../../../utilities";

const usage =
  "Usage: bun run set-dao-charter.ts <daoCharterContract> <charterText>";
const usageExample =
  "Example: bun run set-dao-charter.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.dao-charter 'This is the DAO charter text.'";

interface ExpectedArgs {
  daoCharterContract: string;
  charterText: string;
}

function validateArgs(): ExpectedArgs {
  const [daoCharterContract, charterText] = process.argv.slice(2);
  if (!daoCharterContract || !charterText) {
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
    charterText,
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
    functionName: "set-dao-charter",
    functionArgs: [Cl.stringUtf8(args.charterText)],
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
      `Error setting DAO charter:`,
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
