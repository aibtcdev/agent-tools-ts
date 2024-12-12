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
  getStxCityHash,
} from "../utilities";
import * as path from "path";
import { Eta } from "eta";

const BONDING_CURVE_SEND_ADDRESS_1 = {
  mainnet: "SP11WRT9TPPKP5492X3VE81CM1T74MD13SPFT527D",
  testnet: "ST2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2SYCBMRR",
};

const BONDING_CURVE_SEND_ADDRESS_2 = {
  mainnet: "SP1WTA0YBPC5R6GDMPPJCEDEA6Z2ZEPNMQ4C39W6M",
  testnet: "ST2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2SYCBMRR",
};

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
const nextPossibleNonce = await getNextNonce(network, senderAddress);

async function GenerateBondingTokenContract(
  tokenSymbol: string,
  tokenName: string,
  tokenMaxSupply: string,
  tokenDecimals: string,
  tokenUri: string,
  senderAddress: string
): Promise<string> {
  // Initialize Eta
  const eta = new Eta({ views: path.join(__dirname, "templates") });

  // Generate contract hash
  const contractId = `${senderAddress}.${tokenSymbol.toLowerCase()}-stxcity-dex`;
  const hash = await getStxCityHash(contractId);

  // Prepare template data
  const data = {
    sip10_trait: getTraitReference(network, "SIP010_FT"),
    send_address_1:
      BONDING_CURVE_SEND_ADDRESS_1[
        network as keyof typeof BONDING_CURVE_SEND_ADDRESS_1
      ],
    token_symbol: tokenSymbol,
    token_name: tokenName,
    token_max_supply: tokenMaxSupply,
    token_decimals: tokenDecimals,
    token_uri: tokenUri,
    creator: senderAddress,
    hash: hash,
    dex_contract: contractId,
    target_stx: "2000",
  };

  // Render the template
  return eta.render("bonding.tmpl", data);
}

function GenerateBondingDexContract(
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

async function deployContract(
  sourceCode: string,
  tokenSymbol: string,
  isDex: boolean = false
) {
  try {
    const formattedContractName = isDex
      ? `${tokenSymbol}-stxcity-dex`.toLowerCase()
      : `${tokenSymbol}-stxcity`.toLowerCase();
    const theNextNonce = isDex ? nextPossibleNonce + 1 : nextPossibleNonce;

    const txOptions: SignedContractDeployOptions = {
      contractName: formattedContractName,
      codeBody: sourceCode,
      clarityVersion: 2,
      network: networkObj,
      senderKey: key,
      nonce: theNextNonce,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      fee: BigInt(1_000_000), // 1 STX
    };

    const transaction = await makeContractDeploy(txOptions);
    const broadcastResponse = await broadcastTransaction(transaction, networkObj);

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
      return false;
    } else {
      console.log("Transaction broadcasted successfully!");
      console.log(`FROM: ${address}`);
      console.log(`TXID: 0x${broadcastResponse.txid}`);
      console.log(`CONTRACT: ${address}.${formattedContractName}`);
      return true;
    }
  } catch (error) {
    console.log(`Error deploying contract: ${error}`);
    return false;
  }
}

async function main() {
  // Command line arguments
  const [tokenSymbol, tokenName, tokenMaxSupply, tokenDecimals, tokenUri] =
    process.argv.slice(2);

  if (
    !tokenSymbol ||
    !tokenName ||
    !tokenMaxSupply ||
    !tokenDecimals ||
    !tokenUri
  ) {
    console.log(
      "Usage: bun run deploy-package.ts <tokenSymbol> <tokenName> <tokenMaxSupply> <tokenDecimals> <tokenUri>"
    );
    process.exit(1);
  }

  console.log("Generating and deploying token contract...");
  const bondingTokenContract = await GenerateBondingTokenContract(
    tokenSymbol,
    tokenName,
    tokenMaxSupply,
    tokenDecimals,
    tokenUri,
    senderAddress
  );

  const tokenDeploySuccess = await deployContract(bondingTokenContract, tokenSymbol);
  
  if (!tokenDeploySuccess) {
    console.log("Token deployment failed. Aborting DEX deployment.");
    process.exit(1);
  }

  console.log("\nGenerating and deploying DEX contract...");
  const bondingDexContract = GenerateBondingDexContract(
    tokenMaxSupply,
    tokenDecimals,
    senderAddress,
    tokenSymbol
  );

  const dexDeploySuccess = await deployContract(bondingDexContract, tokenSymbol, true);
  
  if (!dexDeploySuccess) {
    console.log("DEX deployment failed.");
    process.exit(1);
  }

  console.log("Both token and DEX contracts deployed successfully.");
}

main().catch((error) => {
  console.error("Error in main:", error);
  process.exit(1);
});