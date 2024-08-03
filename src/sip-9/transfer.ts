import {
    makeContractCall,
    broadcastTransaction,
    AnchorMode,
    PostConditionMode,
    uintCV,
    standardPrincipalCV,
  } from "@stacks/transactions";
  import { getNetwork, CONFIG, deriveChildAccount, getNextNonce } from "../utilities";
  
  async function transferNft(contractAddress, contractName, tokenId, recipient, accountIndex) {
    const network = getNetwork(CONFIG.NETWORK);
    const { address, key } = await deriveChildAccount(CONFIG.NETWORK, CONFIG.MNEMONIC, accountIndex);
    const nonce = await getNextNonce(CONFIG.NETWORK, address);
  
    console.log(`Preparing to transfer NFT from account index ${accountIndex} (${address})`);
  
    const txOptions = {
      contractAddress,
      contractName,
      functionName: "transfer",
      functionArgs: [uintCV(tokenId), standardPrincipalCV(address), standardPrincipalCV(recipient)],
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
      console.log('Transaction broadcast successfully!');
      console.log('Transaction ID:', broadcastResponse.txid);
      console.log(`NFT transfer initiated. Check the transaction status at: https://explorer.stacks.co/txid/${broadcastResponse.txid}`);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error transferring NFT: ${error.message}`);
      } else {
        console.error(`An unknown error occurred while transferring NFT`);
      }
    }
  }
  
  const [contractAddress, name, tokenIdArg, recipient, accountIndexArg] = process.argv.slice(2);
  const tokenId = tokenIdArg ? parseInt(tokenIdArg) : null;
  const accountIndex = accountIndexArg ? parseInt(accountIndexArg) : 0;
  
  if (contractAddress && name && tokenId !== null && !isNaN(tokenId) && recipient) {
    transferNft(contractAddress, name, tokenId, recipient, accountIndex);
  } else {
    console.error("Please provide contractAddress, name, tokenId, recipient, optionally accountIndex");
    console.error("Usage: <contractAddress> <name> <tokenId> <recipient> [accountIndex]");
  }
  