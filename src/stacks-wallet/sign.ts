import {
  signStructuredData,
  stringAsciiCV,
  tupleCV,
  uintCV,
} from "@stacks/transactions";
import { deriveChildAccount, getNetwork, CONFIG } from "../utilities.js";

async function signMessage() {
  const { NETWORK, MNEMONIC, ACCOUNT_INDEX } = CONFIG;

  // Ensure config values are present
  if (!NETWORK) {
    throw new Error("No network provided in environment variables");
  }
  if (!MNEMONIC) {
    throw new Error("No mnemonic provided in environment variables");
  }
  if (!ACCOUNT_INDEX) {
    throw new Error("No account index provided in environment variables");
  }

  const networkObj = getNetwork(NETWORK);
  const { address, key: privateKeyString } = await deriveChildAccount(
    NETWORK,
    MNEMONIC,
    ACCOUNT_INDEX
  );

  // Use privateKeyString directly instead of createStacksPrivateKey
  const privateKey = privateKeyString;

  // Domain and message values
  const domain = tupleCV({
    name: stringAsciiCV("aibtcdev"),
    version: stringAsciiCV("0.0.2"),
    "chain-id": uintCV(networkObj.chainId),
  });

  const message = stringAsciiCV(address);

  const signedMessage = signStructuredData({
    message,
    domain,
    privateKey,
  });

  return { signedMessage, address };
}

signMessage()
  .then(({ signedMessage, address }) => {
    console.log(`Signed Message: ${signedMessage}`);
    console.log(`Signed By: ${address}`);
  })
  .catch(console.error);
