import {
  getAddressFromPrivateKey,
  makeContractDeploy,
  broadcastTransaction,
  AnchorMode,
  SignedContractDeployOptions,
  PostConditionMode,
} from "@stacks/transactions";
import {
  CONFIG,
  deriveChildAccount,
  getNetwork,
  getNextNonce,
} from "../utilities";
import { join } from "path";
import { readFileSync } from "fs";

const networkObj = getNetwork(CONFIG.NETWORK);
const network = CONFIG.NETWORK;

async function deployContract(contractPath: string) {
  try {
    // Read the contract file
    const fullPath = join(process.cwd(), "generated", contractPath);
    console.log(`Reading contract file: ${fullPath}`);
    const sourceCode = readFileSync(fullPath, "utf-8");

    // Extract contract name from file path
    const contractName =
      contractPath.split("/").pop()?.replace(".clar", "") || "";
    if (!contractName) {
      throw new Error("Could not extract contract name from file path");
    }

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
      postConditionMode: PostConditionMode.Allow,
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

// Get the contract path from command line arguments and call deployContract
const contractPath = process.argv[2];

if (contractPath) {
  deployContract(contractPath);
} else {
  console.error(
    "Please provide the path to the contract file (relative to the 'generated' directory)"
  );
  console.error("Example: npm run deploy bite/bite-core-proposals-v2.clar");
}
