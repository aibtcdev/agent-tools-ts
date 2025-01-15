import {
  AnchorMode,
  broadcastTransaction,
  getAddressFromPrivateKey,
  makeContractCall,
  uintCV,
  contractPrincipalCV,
  SignedContractCallOptions,
} from "@stacks/transactions";
import {
  CONFIG,
  deriveChildAccount,
  getNetwork,
  getNextNonce,
} from "../../utilities";

// buys tokens from the bonding curve DEX
async function main() {
  const [dexContractAddress, dexContractName] =
    process.argv[2]?.split(".") || [];
  const [tokenContractAddress, tokenContractName] =
    process.argv[3]?.split(".") || [];
  const stxAmount = process.argv[4];

  if (
    !dexContractAddress ||
    !dexContractName ||
    !tokenContractAddress ||
    !tokenContractName ||
    !stxAmount
  ) {
    console.log(
      "Usage: bun run buy-token.ts <dexContract> <tokenContract> <stxAmount>"
    );
    console.log(
      "- e.g. bun run buy-token.ts ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.token-dex ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.token 1000000"
    );

    process.exit(1);
  }

  const networkObj = getNetwork(CONFIG.NETWORK);
  const { key } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  const senderAddress = getAddressFromPrivateKey(key, networkObj.version);
  const nextPossibleNonce = await getNextNonce(CONFIG.NETWORK, senderAddress);

  const txOptions: SignedContractCallOptions = {
    anchorMode: AnchorMode.Any,
    contractAddress: dexContractAddress,
    contractName: dexContractName,
    functionName: "buy",
    functionArgs: [
      contractPrincipalCV(tokenContractAddress, tokenContractName),
      uintCV(stxAmount),
    ],
    network: networkObj,
    nonce: nextPossibleNonce,
    senderKey: key,
  };

  const transaction = await makeContractCall(txOptions);
  const broadcastResponse = await broadcastTransaction(transaction, networkObj);

  console.log(
    `Buy transaction broadcast successfully: 0x${broadcastResponse.txid}`
  );
  console.log(`Full response: ${JSON.stringify(broadcastResponse, null, 2)}`);
}

main().catch((error) => {
  error instanceof Error
    ? console.error(JSON.stringify({ success: false, message: error.message }))
    : console.error(JSON.stringify({ success: false, message: String(error) }));

  process.exit(1);
});
