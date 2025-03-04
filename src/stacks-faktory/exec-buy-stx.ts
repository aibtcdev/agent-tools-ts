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
  "Usage: bun run exec-buy-stx.ts <stx_amount> <dex_contract> [slippage]";
const usageExample =
  "Example: bun run exec-buy-stx.ts 100 SP35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-dex 15";

interface ExpectedArgs {
  stxAmount: number; // STX amount in normal units
  dexContract: string; // DEX contract address
  slippage: number; // integer, e.g. 15 = 15% (default)
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [stxAmountStr, dexContract, slippageStr] = process.argv.slice(2);
  const stxAmount = parseFloat(stxAmountStr);
  const slippage = parseInt(slippageStr) || 15;
  if (!stxAmount || !dexContract) {
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
    stxAmount,
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
  console.log("Checking token denomination...");
  const tokenInfo = await sdk.getToken(args.dexContract);
  const isBtcDenominated = tokenInfo.data.denomination === "btc";

  // Verify the token is STX denominated
  if (isBtcDenominated) {
    throw new Error(
      `Token ${args.dexContract} is BTC denominated. Use exec-buy.ts for BTC denominated tokens.`
    );
  }

  //   console.log(`Token is STX denominated. Using ${args.stxAmount} STX (${args.stxAmount * 1000000} microSTX)`);

  //   // Validate amount range for STX - warn if unusually small
  //   if (args.stxAmount < 0.1) {
  //     console.log(`WARNING: Amount ${args.stxAmount} STX is unusually small. Please confirm.`);
  //   }

  // get buy parameters
  console.log("Getting buy parameters...");
  const buyParams = await sdk.getBuyParams({
    dexContract: args.dexContract,
    inAmount: args.stxAmount,
    senderAddress: address,
    slippage: args.slippage,
  });

  // add required properties for signing
  const txOptions: SignedContractCallOptions = {
    ...buyParams,
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
