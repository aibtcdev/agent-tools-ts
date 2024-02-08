import { deriveChildAccounts } from "./utilities";

async function main() {
  // get account info from env
  const network = Bun.env.network;
  const mnemonic = Bun.env.mnemonic;
  const desiredIndex = 9; // hard-coded index for now

  // check that values exist for each
  if (!network) {
    throw new Error("No network provided in environment variables");
  }
  if (!mnemonic) {
    throw new Error("No mnemonic provided in environment variables");
  }

  // get account addresses
  const addresses = await deriveChildAccounts(network, mnemonic, desiredIndex);

  // log account addresses with their index
  addresses.forEach((address, index) => {
    console.log(`${index}: ${address}`);
  });
}

main();
