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
  "Usage: bun run exec-buy.ts <btc_amount> <dex_contract> [slippage]";
const usageExample =
  "Example: bun run exec-buy.ts 0.002 STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.okbtc4-faktory-dex 15";

interface ExpectedArgs {
  btcAmount: number; // BTC amount in normal units
  dexContract: string; // DEX contract address
  slippage: number; // integer, e.g. 15 = 15% (default)
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [btcAmountStr, dexContract, slippageStr] = process.argv.slice(2);
  const btcAmount = parseFloat(btcAmountStr);
  const slippage = parseInt(slippageStr) || 15;
  if (!btcAmount || !dexContract) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // verify contract addresses extracted from arguments
  const [dexContractAddress, dexContractName] = dexContract.split(".");
  if (!dexContractAddress || !dexContractName) {
    const errorMessage = [
      `Invalid contract address: ${dexContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // return validated arguments
  return {
    btcAmount,
    dexContract,
    slippage,
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

  // Check token denomination
  // console.log("Checking token denomination...");
  const tokenInfo = await sdk.getToken(args.dexContract);
  const isBtcDenominated = tokenInfo.data.denomination === "btc";

  // Verify the token is BTC denominated
  if (!isBtcDenominated) {
    throw new Error(
      `Token ${args.dexContract} is not BTC denominated. Use exec-buy-stx.ts for STX denominated tokens.`
    );
  }

  // console.log(
  //   `Token is BTC denominated. Using ${args.btcAmount} BTC (${
  //     args.btcAmount * 100000000
  //   } satoshis)`
  // );

  // // Validate amount range for BTC - warn if unusually large
  // if (args.btcAmount > 0.1) {
  //   console.log(
  //     `WARNING: Amount ${args.btcAmount} BTC is unusually large. Please confirm.`
  //   );
  // }

  // get buy parameters
  // console.log("Getting buy parameters...");
  const buyParams = await sdk.getBuyParams({
    dexContract: args.dexContract,
    inAmount: args.btcAmount, // accepts BTC amount for BTC-denominated tokens
    senderAddress: address,
    slippage: args.slippage,
  });

  // add required properties for signing
  const txOptions: SignedContractCallOptions = {
    ...(buyParams as any),
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
