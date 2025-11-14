import {
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  sendToLLM,
  ToolResponse,
} from "../utilities";

// get address for a given account index in the wallet

async function main() {
  // get account info from env
  const network = CONFIG.NETWORK;
  const mnemonic = CONFIG.MNEMONIC;
  const accountIndex = CONFIG.ACCOUNT_INDEX;

  // check that values exist for each
  if (!network) {
    throw new Error("No network provided in environment variables");
  }
  if (!mnemonic) {
    throw new Error("No mnemonic provided in environment variables");
  }

  // get account address
  const { address } = await deriveChildAccount(network, mnemonic, accountIndex);

  // log account address with account index
  const returnValue: ToolResponse<string> = {
    success: true,
    message: `Derived address for account index ${accountIndex}: ${address}`,
    data: address,
  };
  return returnValue;
}

main()
  .then(sendToLLM)
  .catch((error) => {
    createErrorResponse(error);
    process.exit(1);
  });
