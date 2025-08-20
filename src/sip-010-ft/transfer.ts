import {
  makeContractCall,
  uintCV,
  noneCV,
  Pc,
  principalCV,
} from "@stacks/transactions";
import {
  CONFIG,
  getNetwork,
  deriveChildAccount,
  getNextNonce,
  broadcastTx,
  sendToLLM,
  createErrorResponse,
} from "../utilities";
import { TokenInfoService } from "../api/token-info-service";
import { ContractCallError } from "../api/contract-calls-client";

async function transfer(
  contractAddress: string,
  contractName: string,
  recipient: string,
  amount: number
) {
  const networkObj = getNetwork(CONFIG.NETWORK);
  const { address, key } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  const nonce = await getNextNonce(CONFIG.NETWORK, address);

  // Get token metadata to extract asset name
  const contractId = `${contractAddress}.${contractName}`;

  try {
    // Get asset name from contract ABI
    const tokenInfoService = new TokenInfoService(CONFIG.NETWORK);
    const assetName = await tokenInfoService.getAssetNameFromAbi(contractId);

    if (!assetName) {
      throw new Error(
        `Could not determine asset name for token contract: ${contractId}`
      );
    }

    console.log(`Asset name from ABI: ${assetName}`);

    // Add post-conditions to ensure sender sends exact amount of FT
    const postConditions = [
      Pc.principal(address)
        .willSendEq(amount)
        .ft(`${contractAddress}.${contractName}`, assetName),
    ];

    const txOptions = {
      contractAddress,
      contractName,
      functionName: "transfer",
      functionArgs: [
        uintCV(amount),
        principalCV(address),
        principalCV(recipient),
        noneCV(),
      ],
      senderKey: key,
      validateWithAbi: true,
      network: networkObj,
      postConditions,
      nonce,
    };

    // broadcast transaction and return response
    const transaction = await makeContractCall(txOptions);
    const broadcastResponse = await broadcastTx(transaction, networkObj);
    return broadcastResponse;
  } catch (error) {
    // Check if it's a ContractCallError
    if (error instanceof ContractCallError) {
      throw new Error(`Contract call failed: ${error.message} (${error.code})`);
    }
    throw error;
  }
}

const [contractAddress, contractName] = process.argv[2]?.split(".") || [];
const recipient = process.argv[3];
const amount = process.argv[4] ? parseInt(process.argv[4]) : null;

if (contractAddress && contractName && recipient && amount) {
  transfer(contractAddress, contractName, recipient, amount)
    .then(sendToLLM)
    .catch((error) => {
      sendToLLM(createErrorResponse(error));
      process.exit(1);
    });
} else {
  console.error(
    "Please provide: contract_address.contract_name recipient amount"
  );
}
