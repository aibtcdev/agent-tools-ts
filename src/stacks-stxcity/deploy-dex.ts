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
  getTraitReference,
} from "../utilities";
import * as path from "path";
import { Eta } from "eta";

const BONDING_CURVE_SEND_ADDRESS = {
  mainnet: "SP1WG62TA0D3K980WGSTZ0QA071TZD4ZXNKP0FQZ7",
  testnet: "ST2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2SYCBMRR",
};

const networkObj = getNetwork(CONFIG.NETWORK);
const network = CONFIG.NETWORK;

// Derive child account from mnemonic
const { address, key } = await deriveChildAccount(
  CONFIG.NETWORK,
  CONFIG.MNEMONIC,
  CONFIG.ACCOUNT_INDEX
);

const senderAddress = getAddressFromPrivateKey(key, networkObj.version);

export function GenerateBondingDexContract(
  tokenMaxSupply: string,
  tokenDecimals: string,
  senderAddress: string,
  tokenSymbol: string
): string {
  // Initialize Eta
  const eta = new Eta({ views: path.join(__dirname, "templates") });

  const tokenContract = `${senderAddress}.${tokenSymbol.toLowerCase()}-stxcity`;

  // Prepare template data
  const data = {
    sip10_trait: getTraitReference(network, "SIP010_FT"),
    send_address:
      BONDING_CURVE_SEND_ADDRESS[
        network as keyof typeof BONDING_CURVE_SEND_ADDRESS
      ],
    token_contract: tokenContract,
    token_max_supply: tokenMaxSupply,
    token_decimals: tokenDecimals,
    creator: senderAddress,
    token_symbol: tokenSymbol,
  };

  // Render the template
  return eta.render("dex.tmpl", data);
}

async function deployContract(sourceCode: string, tokenSymbol: string) {
  try {
    const formattedContractName = `${tokenSymbol}-stxcity-dex`.toLowerCase();
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
      console.log("Transaction failed to broadcast");
      console.log(`Error: ${broadcastResponse.error}`);
      if (broadcastResponse.reason) {
        console.log(`Reason: ${broadcastResponse.reason}`);
      }
      if (broadcastResponse.reason_data) {
        console.log(
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
    console.log(`Error deploying contract: ${error}`);
  }
}

// Command line arguments
const [tokenSymbol, tokenMaxSupply, tokenDecimals] = process.argv.slice(2);

if (!tokenSymbol || !tokenMaxSupply || !tokenDecimals) {
  console.log(
    "Usage: bun run deploy-bonding-dex.ts <tokenSymbol> <tokenMaxSupply> <tokenDecimals>"
  );
  process.exit(1);
}

const bondingDexContract = GenerateBondingDexContract(
  tokenMaxSupply,
  tokenDecimals,
  senderAddress,
  tokenSymbol
);

await deployContract(bondingDexContract, tokenSymbol);
