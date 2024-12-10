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
import * as path from "path";
import { Eta } from "eta";

export function GenerateBondingDexContract(
  tokenMaxSupply: string,
  tokenDecimals: string,
  senderAddress: string,
  tokenSymbol: string,
  stxTargetAmount: string,
  virtualStxValue: string,
  completeFee: string,
  dexTokenAmount: string,
  dexStxAmount: string,
  burnPercent: string,
  deployerPercent: string
): string {
  // Initialize Eta
  const eta = new Eta({ views: path.join(__dirname, "templates") });

  // Prepare template data
  const data = {
    token_max_supply: tokenMaxSupply,
    token_decimals: tokenDecimals,
    creator: senderAddress,
    token_symbol: tokenSymbol,
    stx_target_amount: stxTargetAmount,
    virtual_stx_value: virtualStxValue,
    complete_fee: completeFee,
    dex_token_amount: dexTokenAmount,
    dex_stx_amount: dexStxAmount,
    burn_percent: burnPercent,
    deployer_percent: deployerPercent,
  };

  // Render the template
  return eta.render("dex.tmpl", data);
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

async function deployContract(sourceCode: string, tokenSymbol: string) {
  try {
    const formattedContractName = `${tokenSymbol}-bonding-dex`.toLowerCase();
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
  tokenMaxSupply,
  tokenDecimals,
  stxTargetAmount,
  virtualStxValue,
  completeFee,
  dexTokenAmount,
  dexStxAmount,
  burnPercent,
  deployerPercent,
] = process.argv.slice(2);

if (
  !tokenSymbol ||
  !tokenMaxSupply ||
  !tokenDecimals ||
  !stxTargetAmount ||
  !virtualStxValue ||
  !completeFee ||
  !dexTokenAmount ||
  !dexStxAmount ||
  !burnPercent ||
  !deployerPercent
) {
  console.log(
    "Usage: bun run deploy-bonding-dex.ts <tokenSymbol> <tokenMaxSupply> <tokenDecimals> <stxTargetAmount> <virtualStxValue> <completeFee> <dexTokenAmount> <dexStxAmount> <burnPercent> <deployerPercent>"
  );
  process.exit(1);
}

const bondingDexContract = GenerateBondingDexContract(
  tokenMaxSupply,
  tokenDecimals,
  senderAddress,
  tokenSymbol,
  stxTargetAmount,
  virtualStxValue,
  completeFee,
  dexTokenAmount,
  dexStxAmount,
  burnPercent,
  deployerPercent
);

await deployContract(bondingDexContract, tokenSymbol);
