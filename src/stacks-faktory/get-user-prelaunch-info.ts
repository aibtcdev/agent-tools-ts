// get-user-prelaunch-info.ts
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

const usage =
  "Usage: bun run get-user-prelaunch-info.ts <prelaunch_contract> [user_address]";
const usageExample =
  "Example: bun run get-user-prelaunch-info.ts STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.simpl1-pre-faktory ST331D6T77PNS2YZXR03CDC4G3XN0SYBPV51RSJW1";

interface ExpectedArgs {
  prelaunchContract: string; // Pre-launch contract address
  userAddress?: string; // User address to check (optional - defaults to current account)
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [prelaunchContract, userAddress] = process.argv.slice(2);
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
    userAddress, // Optional - can be undefined
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

  // use provided user address or default to current account
  const targetUserAddress = args.userAddress || address;

  // get user info
  const userInfo = await sdk.getUserInfo(
    args.prelaunchContract,
    targetUserAddress,
    address
  );
  return userInfo;
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
