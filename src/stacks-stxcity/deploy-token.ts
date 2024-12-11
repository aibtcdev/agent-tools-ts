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
  getTraitReference,
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

const networkObj = getNetwork(CONFIG.NETWORK);
const network = CONFIG.NETWORK;

// Derive child account from mnemonic
const { address, key } = await deriveChildAccount(
  CONFIG.NETWORK,
  CONFIG.MNEMONIC,
  CONFIG.ACCOUNT_INDEX
);

const senderAddress = getAddressFromPrivateKey(key, networkObj.version);

export async function GenerateBondingTokenContract(
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

async function deployContract(sourceCode: string, contractName: string) {
  try {
    const formattedContractName = `${contractName}-stxcity`.toLowerCase();
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
    "Usage: bun run deploy-bonding-token.ts <tokenSymbol> <tokenName> <tokenMaxSupply> <tokenDecimals> <tokenUri>"
  );
  process.exit(1);
}

const bondingTokenContract = await GenerateBondingTokenContract(
  tokenSymbol,
  tokenName,
  tokenMaxSupply,
  tokenDecimals,
  tokenUri,
  senderAddress
);

await deployContract(bondingTokenContract, tokenSymbol);
