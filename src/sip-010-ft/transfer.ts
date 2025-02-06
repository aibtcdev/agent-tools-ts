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
  getHiroTokenMetadata,
  getAssetNameFromIdentifier,
} from "../utilities";

async function transfer(
  contractAddress: string,
  contractName: string,
  recipient: string,
  amount: number
) {
  const network = getNetwork(CONFIG.NETWORK);
  const { address, key } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  const nonce = await getNextNonce(CONFIG.NETWORK, address);

  // Get token metadata to extract asset name
  const contractId = `${contractAddress}.${contractName}`;

  let assetName: string;
  const tokenMetadata = await getHiroTokenMetadata(contractId);
  assetName = getAssetNameFromIdentifier(tokenMetadata.asset_identifier);

  const postConditionAddress = address;
  const postConditionCode = FungibleConditionCode.Equal;
  const postConditionAmount = amount;
  const assetInfo = createAssetInfo(contractAddress, contractName, assetName);

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

  const transaction = await makeContractCall(txOptions);
  const broadcastResponse = await broadcastTransaction(transaction, network);

  return broadcastResponse;
}

const [contractAddress, contractName] = process.argv[2]?.split(".") || [];
const recipient = process.argv[3];
const amount = process.argv[4] ? parseInt(process.argv[4]) : null;

if (contractAddress && contractName && recipient && amount) {
  transfer(contractAddress, contractName, recipient, amount)
    .then(console.log)
    .catch(console.error);
} else {
  console.error(
    "Please provide: contract_address.contract_name recipient amount"
  );
}
