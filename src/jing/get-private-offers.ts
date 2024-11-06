import { CONFIG, deriveChildAccount } from "../utilities";
import { JingCashSDK } from "@jingcash/core-sdk";

async function getPrivateOffers(pair: string, userAddress: string) {
  const { address } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );

  const sdk = new JingCashSDK({
    API_HOST:
      process.env.JING_API_URL || "https://backend-neon-ecru.vercel.app/api",
    API_KEY: process.env.JING_API_KEY || "dev-api-token",
    defaultAddress: address,
    network: CONFIG.NETWORK,
  });

  try {
    const privateOffers = await sdk.getPrivateOffers(pair, userAddress);
    console.log(JSON.stringify(privateOffers, null, 2));
  } catch (error) {
    console.log(error);
  }
}

// Parse command line arguments
const [pair, userAddress] = process.argv.slice(2);

if (!pair || !userAddress) {
  console.log("Usage: bun get-private-offers <pair> <userAddress>");
  console.log(
    "Example: bun src/jing/get-private-offers.ts PEPE-STX SP29D6YMDNAKN1P045T6Z817RTE1AC0JAA99WAX2B"
  );
  process.exit(1);
}

getPrivateOffers(pair, userAddress)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\nError:", error.message);
    process.exit(1);
  });
