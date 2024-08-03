import {
    makeContractCall,
    broadcastTransaction,
    AnchorMode,
    FungibleConditionCode,
    createAssetInfo,
    makeStandardFungiblePostCondition,
    uintCV,
    standardPrincipalCV,
    noneCV,
  } from "@stacks/transactions";
  import { CONFIG, getNetwork, deriveChildAccount, getNextNonce } from "../utilities";
  
  async function transfer(contractAddress, contractName, recipient, amount, accountIndex) {
    const network = getNetwork(CONFIG.NETWORK);
    const { address, key } = await deriveChildAccount(CONFIG.NETWORK, CONFIG.MNEMONIC, accountIndex);
    const nonce = await getNextNonce(CONFIG.NETWORK, address);
  
    const assetInfo = createAssetInfo(contractAddress, contractName, 'suss');
    const postConditions = [
      makeStandardFungiblePostCondition(
        address,
        FungibleConditionCode.Equal,
        amount,
        assetInfo
      ),
    ];
  
    const txOptions = {
      contractAddress,
      contractName,
      functionName: 'transfer',
      functionArgs: [uintCV(amount), standardPrincipalCV(address), standardPrincipalCV(recipient), noneCV()],
      senderKey: key,
      validateWithAbi: true,
      network,
      anchorMode: AnchorMode.Any,
      postConditions,
      nonce,
    };
  
    try {
      console.log("Creating contract call...");
      const transaction = await makeContractCall(txOptions);
      console.log("Broadcasting transaction...");
      const broadcastResponse = await broadcastTransaction(transaction, network);
      console.log('Transaction broadcast successfully!');
      console.log(`Transaction ID: ${broadcastResponse.txid}`);
      console.log(`Check the transaction status at: https://explorer.stacks.co/txid/${broadcastResponse.txid}`);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error transferring tokens: ${error.message}`);
      } else {
        console.error(`An unknown error occurred while transferring tokens`);
      }
    }
  }
  
  const [contractAddress, contractName, recipient, amountArg, accountIndexArg] = process.argv.slice(2);
  const amount = amountArg ? parseInt(amountArg) : null;
  const accountIndex = accountIndexArg ? parseInt(accountIndexArg) : 0;
  
  if (contractAddress && contractName && recipient && amount !== null && !isNaN(amount)) {
    transfer(contractAddress, contractName, recipient, amount, accountIndex);
  } else {
    console.error("Please provide: contract address, contract name, recipient address, amount, and optionally account index");
    console.error("Usage: <contractAddress> <contractName> <recipientAddress> <amount> [accountIndex]");
  }
  