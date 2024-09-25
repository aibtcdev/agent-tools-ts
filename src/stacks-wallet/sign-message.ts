import {
  createStacksPrivateKey,
  signStructuredData,
  stringAsciiCV,
  tupleCV,
  uintCV,
} from "@stacks/transactions";
import {
  CONFIG,
  deriveChildAccount,
  getNetwork,
  getTxVersion,
} from "../utilities";

// MAIN SCRIPT (DO NOT EDIT BELOW)

async function main() {
  // ACCOUNT INFO

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
  if (!accountIndex) {
    throw new Error("No account index provided in environment variables");
  }
  // get network object
  const networkObj = getNetwork(network);
  // get tx version object
  const txVersion = getTxVersion(network);
  // get account address and private key
  const { address, key: privateKeyString } = await deriveChildAccount(
    network,
    mnemonic,
    accountIndex
  );

  // SIGNING THE MESSAGE

  // create private key obj for signature function
  const privateKey = createStacksPrivateKey(privateKeyString);
  // create a domain object as a clarity value
  // based on @stacks.js/transactions signature test
  // https://github.com/hirosystems/stacks.js/blob/fc7e50cb1dca6402677451be06534f0a8f1346b3/packages/transactions/tests/structuredDataSignature.test.ts#L214-L242
  const domain = tupleCV({
    name: stringAsciiCV("aibtcdev"),
    version: stringAsciiCV("0.0.2"),
    "chain-id": uintCV(networkObj.chainId),
  });
  // create the message to be signed as a clarity value
  const message = stringAsciiCV(address);
  // sign the message
  // this is type 10: StructuredDataSignature
  const signedMessage = signStructuredData({
    message,
    domain,
    privateKey,
  });
  // output signed message data
  console.log(signedMessage.data);
}

main();
