import {
  AnchorMode,
  makeContractCall,
  SignedContractCallOptions,
} from "@stacks/transactions";
import {
  broadcastTx,
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  getFaktorySbtcContract,
  getNetwork,
  getNextNonce,
  sendToLLM,
} from "../utilities";

const usage = "Usage: bun run get-faktory-sbtc.ts";
const usageExample = "Example: bun run get-faktory-sbtc.ts";

function validateArgs() {
  // verify all required arguments are provided
  if (process.argv.length !== 2) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
}

async function main() {
  // validate args (not expecting any)
  validateArgs();
  const [sbtcContractAddress, sbtcContractName] = getFaktorySbtcContract(
    CONFIG.NETWORK
  );
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
    contractAddress: sbtcContractAddress,
    contractName: sbtcContractName,
    functionName: "faucet",
    functionArgs: [],
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
