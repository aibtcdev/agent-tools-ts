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
  "Usage: bun run exec-claim.ts <prelaunch_contract> <token_contract>";
const usageExample =
  "Example: bun run exec-claim.ts STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.simpl1-pre-faktory STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.simpl1-faktory";

interface ExpectedArgs {
  prelaunchContract: string; // Pre-launch contract address
  tokenContract: string; // Token contract address
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [prelaunchContract, tokenContract] = process.argv.slice(2);
  if (!prelaunchContract || !tokenContract) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // verify contract addresses extracted from arguments
  const [prelaunchAddress, prelaunchName] = prelaunchContract.split(".");
  const [tokenAddress, tokenName] = tokenContract.split(".");
  if (!prelaunchAddress || !prelaunchName || !tokenAddress || !tokenName) {
    const errorMessage = [
      `Invalid contract addresses: ${prelaunchContract} or ${tokenContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // return validated arguments
  return {
    prelaunchContract,
    tokenContract,
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

  // get claim parameters
  const claimParams = await sdk.getClaimParams({
    prelaunchContract: args.prelaunchContract,
    tokenContract: args.tokenContract,
    senderAddress: address,
  });

  // add required properties for signing
  const txOptions: SignedContractCallOptions = {
    ...(claimParams as any),
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
