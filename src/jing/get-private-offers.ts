import { JingCashSDK } from "@jingcash/core-sdk";

if (!process.env.JING_API_URL || !process.env.JING_API_KEY) {
  console.log("Please set JING_API_URL and JING_API_KEY in your .env file");
  process.exit(1);
}

const [pair, userAddress, ftContract] = process.argv.slice(2);

if (!pair || !userAddress || !ftContract) {
  console.log(
    "Usage: bun get-private-offers <pair> <userAddress> <ftContract>"
  );
  console.log(
    "Example: bun src/jing/get-private-offers.ts PEPE-STX SP29D6YMDNAKN1P045T6Z817RTE1AC0JAA99WAX2B SP1Z92MPDQEWZXW36VX71Q25HKF5K2EPCJ304F275.tokensoft-token-v4k68639zxz"
  );
  process.exit(1);
}

const jingcash = new JingCashSDK({
  API_HOST: process.env.JING_API_URL,
  API_KEY: process.env.JING_API_KEY,
});

try {
  const privateOffers = await jingcash.getPrivateOffers(
    pair,
    userAddress,
    ftContract
  );
  console.log(JSON.stringify(privateOffers, null, 2));
} catch (error) {
  console.log(error);
}
