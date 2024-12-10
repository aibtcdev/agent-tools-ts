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
  getStxCityHash,
} from "../utilities";
import * as path from "path";
import { Eta } from "eta";

export async function GenerateBondingTokenContract(
  tokenSymbol: string,
  tokenName: string,
  tokenMaxSupply: string,
  tokenDecimals: string,
  tokenUri: string,
  senderAddress: string,
  dexTokenAmount: string,
  ownerTokenAmount: string,
  dexStxAmount: string
): Promise<string> {
  // Initialize Eta
  const eta = new Eta({ views: path.join(__dirname, "templates") });

  // Generate contract hash
  const contractId = `${senderAddress}.${tokenSymbol}-stxcity-dex`;
  const hash = await getStxCityHash(contractId);

  // Prepare template data
  const data = {
    token_symbol: tokenSymbol,
    token_name: tokenName,
    token_max_supply: tokenMaxSupply,
    token_decimals: tokenDecimals,
    token_uri: tokenUri,
    creator: senderAddress,
    hash: hash,
    dex_token_amount: dexTokenAmount,
    owner_token_amount: ownerTokenAmount,
    dex_stx_amount: dexStxAmount,
  };

  // Render the template
  return eta.render("bonding.tmpl", data);
}

const networkObj = getNetwork(CONFIG.NETWORK);
const network = CONFIG.NETWORK;

// Derive child account from mnemonic
const { address, key } = await deriveChildAccount(
  CONFIG.NETWORK,
  CONFIG.MNEMONIC,
  CONFIG.ACCOUNT_INDEX
);

const senderAddress = getAddressFromPrivateKey(key, networkObj.version);

async function deployContract(sourceCode: string, contractName: string) {
  try {
    const formattedContractName = `${contractName}-bonding-token`.toLowerCase();
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
const [
  tokenSymbol,
  tokenName,
  tokenMaxSupply,
  tokenDecimals,
  tokenUri,
  dexTokenAmount,
  ownerTokenAmount,
  dexStxAmount,
] = process.argv.slice(2);

if (
  !tokenSymbol ||
  !tokenName ||
  !tokenMaxSupply ||
  !tokenDecimals ||
  !tokenUri ||
  !dexTokenAmount ||
  !ownerTokenAmount ||
  !dexStxAmount
) {
  console.log(
    "Usage: bun run deploy-bonding-token.ts <tokenSymbol> <tokenName> <tokenMaxSupply> <tokenDecimals> <tokenUri> <dexTokenAmount> <ownerTokenAmount> <dexStxAmount>"
  );
  process.exit(1);
}

const bondingTokenContract = await GenerateBondingTokenContract(
  tokenSymbol,
  tokenName,
  tokenMaxSupply,
  tokenDecimals,
  tokenUri,
  senderAddress,
  dexTokenAmount,
  ownerTokenAmount,
  dexStxAmount
);

await deployContract(bondingTokenContract, tokenSymbol);
