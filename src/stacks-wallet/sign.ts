import {
  createStacksPrivateKey,
  signStructuredData,
  stringAsciiCV,
  tupleCV,
  uintCV,
} from "@stacks/transactions";
import { deriveChildAccount, getNetwork, CONFIG } from "../utilities.js";

async function signMessage() {
  const { NETWORK, MNEMONIC, ACCOUNT_INDEX } = CONFIG;

  // Ensure config values are present
  if (!NETWORK || !MNEMONIC) {
    throw new Error("Missing network or mnemonic configuration");
  }

  const networkObj = getNetwork(NETWORK);
  const { address, key: privateKeyString } = await deriveChildAccount(
    NETWORK,
    MNEMONIC,
    ACCOUNT_INDEX
  );

  console.log(`Signing message for address: ${address}`);

  const privateKey = createStacksPrivateKey(privateKeyString);

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
    console.log(`Signed Message: ${JSON.stringify(signedMessage.data)}`);
    console.log(`Address: ${address}`);
  })
  .catch(console.error);
