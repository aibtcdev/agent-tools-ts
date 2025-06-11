// get-is-market-open.ts
import { FaktorySDK } from "@faktoryfun/core-sdk";
import {
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  sendToLLM,
} from "../utilities";

const faktoryConfig = {
  network: CONFIG.NETWORK as "mainnet" | "testnet",
  hiroApiKey: CONFIG.HIRO_API_KEY,
};

const usage = "Usage: bun run get-is-market-open.ts <prelaunch_contract>";
const usageExample =
  "Example: bun run get-is-market-open.ts STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.simpl1-pre-faktory";

interface ExpectedArgs {
  prelaunchContract: string; // Pre-launch contract address
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [prelaunchContract] = process.argv.slice(2);
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
  };
}

async function main() {
  // validate and store provided args
  const args = validateArgs();
  // setup network and wallet info
  const { address } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  const sdk = new FaktorySDK(faktoryConfig);

  // check if market is open
  const marketStatus = await sdk.isMarketOpen(args.prelaunchContract, address);
  return marketStatus;
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
