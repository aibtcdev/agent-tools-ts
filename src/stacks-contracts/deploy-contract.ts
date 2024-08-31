import {
  getAddressFromPrivateKey,
  makeContractDeploy,
  broadcastTransaction,
  AnchorMode,
  SignedContractDeployOptions,
} from "@stacks/transactions";
import {
  CONFIG,
  deriveChildAccount,
  getNetwork,
  getNextNonce,
} from "../utilities";

const networkObj = getNetwork(CONFIG.NETWORK);
const network = CONFIG.NETWORK;

async function deployContract(sourceCode: string, contractName: string) {
  try {
    // Derive child account from mnemonic
    const { address, key } = await deriveChildAccount(
      CONFIG.NETWORK,
      CONFIG.MNEMONIC,
      CONFIG.ACCOUNT_INDEX
    );

    const formattedContractName = contractName
      .replace(/([a-z])([A-Z])/g, "$1-$2")
      .toLowerCase();
    const senderAddress = getAddressFromPrivateKey(key, networkObj.version);
    const nextPossibleNonce = await getNextNonce(network, senderAddress);

    const txOptions: SignedContractDeployOptions = {
      contractName: formattedContractName,
      codeBody: sourceCode,
      clarityVersion: 2,
      network: networkObj,
      senderKey: key,
      nonce: nextPossibleNonce,
      anchorMode: AnchorMode.Any,
      fee: BigInt(1_000_000), // 1 STX
    };

    const transaction = await makeContractDeploy(txOptions);
    const broadcastResponse = await broadcastTransaction(
      transaction,
      networkObj
    );

    if ("error" in broadcastResponse) {
      console.error("Transaction failed to broadcast");
      console.error(`Error: ${broadcastResponse.error}`);
      if (broadcastResponse.reason) {
        console.error(`Reason: ${broadcastResponse.reason}`);
      }
      if (broadcastResponse.reason_data) {
        console.error(
          `Reason Data: ${JSON.stringify(
            broadcastResponse.reason_data,
            null,
            2
          )}`
        );
      }
    } else {
      console.log("Transaction broadcasted successfully!");
      console.log(`FROM: ${address}`);
      console.log(`TXID: 0x${broadcastResponse.txid}`);
      console.log(`CONTRACT: ${address}.${formattedContractName}`);
    }
  } catch (error) {
    console.error(`Error deploying contract: ${error}`);
  }
}

// Get the source code and contract name from command line arguments and call deployContract
const contractName = process.argv[2];
const sourceCode = process.argv[3];

if (sourceCode) {
  deployContract(sourceCode, contractName);
} else {
  console.error("Please provide the contract source code as an argument.");
}
