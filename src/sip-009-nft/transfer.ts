import {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  uintCV,
  standardPrincipalCV,
} from "@stacks/transactions";
import {
  CONFIG,
  getNetwork,
  deriveChildAccount,
  getNextNonce,
} from "../utilities";

async function transferNft(
  contractAddress: string,
  contractName: string,
  tokenId: number,
  recipient: string,
  accountIndex: number
) {
  const network = getNetwork(CONFIG.NETWORK);
  const { address, key } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    accountIndex
  );
  const nonce = await getNextNonce(CONFIG.NETWORK, address);

  console.log(
    `Preparing to transfer NFT from account index ${accountIndex} (${address})`
  );

  const txOptions = {
    contractAddress,
    contractName,
    functionName: "transfer",
    functionArgs: [
      uintCV(tokenId),
      standardPrincipalCV(address),
      standardPrincipalCV(recipient),
    ],
    senderKey: key,
    validateWithAbi: true,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    nonce,
  };

  try {
    console.log("Creating contract call...");
    const transaction = await makeContractCall(txOptions);
    console.log("Broadcasting transaction...");
    const broadcastResponse = await broadcastTransaction(transaction, network);
    console.log("Transaction broadcast successfully!");
    console.log("Transaction ID:", broadcastResponse.txid);
    console.log(
      `NFT transfer initiated. Check the transaction status at: https://explorer.stacks.co/txid/${broadcastResponse.txid}`
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Error transferring NFT: ${error.message}`);
    } else {
      console.error(`An unknown error occurred while transferring NFT`);
    }
  }
}

const [contractAddress, contractName] = process.argv[2]?.split(".") || [];
const tokenId = process.argv[3] ? parseInt(process.argv[3]) : null;
const recipient = process.argv[4];
const accountIndex = process.argv[5] ? parseInt(process.argv[5]) : 0; // Default to 0 if not provided

if (contractAddress && contractName && tokenId !== null && recipient) {
  transferNft(contractAddress, contractName, tokenId, recipient, accountIndex);
} else {
  console.error(
    "Please provide: contract address.name, token ID, recipient address, and optionally account index"
  );
}
