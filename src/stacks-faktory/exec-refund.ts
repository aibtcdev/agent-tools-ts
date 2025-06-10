import { FaktorySDK } from "@faktoryfun/core-sdk";
import {
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
} from "../utilities";

const faktoryConfig = {
  network: CONFIG.NETWORK as "mainnet" | "testnet",
  hiroApiKey: CONFIG.HIRO_API_KEY,
};

const usage =
  "Usage: bun run exec-refund.ts <prelaunch_contract> [contract_type]";
const usageExample =
  "Example: bun run exec-refund.ts STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.simpl1-pre-faktory dao";

interface ExpectedArgs {
  prelaunchContract: string; // Pre-launch contract address
  contractType: "meme" | "dao" | "helico"; // Contract type
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [prelaunchContract, contractTypeStr] = process.argv.slice(2);
  const contractType = (contractTypeStr as "meme" | "dao" | "helico") || "dao";

  if (!prelaunchContract) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // verify contract address extracted from arguments
  const [contractAddress, contractName] = prelaunchContract.split(".");
  if (!contractAddress || !contractName) {
    const errorMessage = [
      `Invalid contract address: ${prelaunchContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // return validated arguments
  return {
    prelaunchContract,
    contractType,
  };
}

async function main() {
  // validate and store provided args
  const args = validateArgs();
  // setup network and wallet info
  const networkObj = getNetwork(CONFIG.NETWORK);
  const { address, key } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  const nextPossibleNonce = await getNextNonce(CONFIG.NETWORK, address);
  const sdk = new FaktorySDK(faktoryConfig);

  // get refund parameters
  const refundParams = await sdk.getRefundParams({
    prelaunchContract: args.prelaunchContract,
    senderAddress: address,
    contractType: args.contractType,
  });

  // add required properties for signing
  const txOptions: SignedContractCallOptions = {
    ...(refundParams as any),
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
