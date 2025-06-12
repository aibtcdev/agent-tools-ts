// faucet-sbtc.ts
// Call sBTC faucet for current account (account 0)
import {
  makeContractCall,
  SignedContractCallOptions,
  AnchorMode,
  PostConditionMode,
} from "@stacks/transactions";
import {
  broadcastTx,
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  getNetwork,
  getNextNonce,
  sendToLLM,
} from "../../utilities";

const SBTC_CONTRACT = "STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token";

async function main() {
  const { address, key } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );

  const networkObj = getNetwork(CONFIG.NETWORK);
  const nonce = await getNextNonce(CONFIG.NETWORK, address);

  const [contractAddress, contractName] = SBTC_CONTRACT.split(".");

  const txOptions: SignedContractCallOptions = {
    contractAddress,
    contractName,
    functionName: "faucet",
    functionArgs: [], // No arguments for faucet
    network: networkObj,
    // anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    nonce,
    senderKey: key,
  };

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
