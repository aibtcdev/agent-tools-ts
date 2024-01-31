// pay a stacks-m2m invoice
// with post-conditions

import { TransactionVersion } from "@stacks/transactions";
import {
  generateWallet,
  generateNewAccount,
  getStxAddress,
} from "@stacks/wallet-sdk";

async function main() {
  // get seed phrase from env
  const network = Bun.env.network;
  const mnemonic = Bun.env.mnemonic;
  const accountIndex = Bun.env.accountIndex;

  // get account address and private key
  const { address, key } = await deriveChildAccount(
    network,
    mnemonic,
    accountIndex
  );

  console.log("Address:", address);
}

main();

async function getTxVersion(network: string) {
  switch (network) {
    case "mainnet":
      return TransactionVersion.Mainnet;
    case "testnet":
      return TransactionVersion.Testnet;
    default:
      return TransactionVersion.Testnet;
  }
}

async function deriveChildAccount(
  network: string,
  mnemonic: string,
  index: number
) {
  // using a blank password since wallet isn't persisted
  const password = "";
  // create a Stacks wallet with the mnemonic
  let wallet = await generateWallet({
    secretKey: mnemonic,
    password: password,
  });
  // add a new account to reach the selected index
  for (let i = 0; i <= index; i++) {
    wallet = generateNewAccount(wallet);
  }
  // return address and key for selected index
  return {
    address: getStxAddress({
      account: wallet.accounts[index],
      transactionVersion: await getTxVersion(network),
    }),
    key: wallet.accounts[index].stxPrivateKey,
  };
}
