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
import {
  CONFIG,
  getNetwork,
  deriveChildAccount,
  getNextNonce,
} from "../utilities";

async function transfer(
  contractAddress: string,
  contractName: string,
  recipient: string,
  amount: number,
  accountIndex: number
) {
  const network = getNetwork(CONFIG.NETWORK);
  const { address, key } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    accountIndex
  );
  const nonce = await getNextNonce(CONFIG.NETWORK, address);

  const postConditionAddress = address;
  const postConditionCode = FungibleConditionCode.Equal;
  const postConditionAmount = amount;
  const assetInfo = createAssetInfo(contractAddress, contractName, "suss");

  const postConditions = [
    makeStandardFungiblePostCondition(
      postConditionAddress,
      postConditionCode,
      postConditionAmount,
      assetInfo
    ),
  ];

  const txOptions = {
    contractAddress,
    contractName,
    functionName: "transfer",
    functionArgs: [
      uintCV(amount),
      standardPrincipalCV(address),
      standardPrincipalCV(recipient),
      noneCV(),
    ],
    senderKey: key,
    validateWithAbi: true,
    network,
    anchorMode: AnchorMode.Any,
    postConditions,
    nonce,
  };

  try {
    const transaction = await makeContractCall(txOptions);
    const broadcastResponse = await broadcastTransaction(transaction, network);
    console.log("Transaction ID:", broadcastResponse.txid);
  } catch (error: any) {
    console.error(`Error transferring tokens: ${error.message}`);
  }
}

const [contractAddress, contractName] = process.argv[2]?.split(".") || [];
const recipient = process.argv[3];
const amount = process.argv[4] ? parseInt(process.argv[4]) : null;
const accountIndex = process.argv[5] ? parseInt(process.argv[5]) : 0;

if (contractAddress && contractName && recipient && amount !== null) {
  transfer(contractAddress, contractName, recipient, amount, accountIndex);
} else {
  console.error(
    "Please provide: contract address.name, recipient address, amount, and optionally account index"
  );
}
