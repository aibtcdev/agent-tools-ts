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
  getAddressReference,
} from "../utilities";
import * as path from "path";
import { Eta } from "eta";

enum ContractType {
  TOKEN,
  POOL,
  DEX,
}

type ContractNames = {
  [key in ContractType]: string;
};

type DeploymentResult = {
  success: boolean;
  contracts: {
    token: any | null;
    pool: any | null;
    dex: any | null;
  };
  error?: {
    stage?: string;
    message?: string;
    reason?: string | null;
    details?: any;
  };
};

// Derive child account from mnemonic
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

  // Generate variables
  const contractId = `${senderAddress}.${tokenSymbol.toLowerCase()}-aibtcdev-dex`;
  const decimals = parseInt(tokenDecimals, 10);
  const maxSupply = parseInt(tokenMaxSupply, 10);
  const calculatedMaxSupply = maxSupply * Math.pow(10, decimals);

  // Prepare template data
  const data = {
    sip10_trait: getTraitReference(network, "SIP010_FT"),
    token_symbol: tokenSymbol,
    token_name: tokenName,
    token_max_supply: calculatedMaxSupply.toString(),
    token_decimals: tokenDecimals,
    token_uri: tokenUri,
    creator: senderAddress,
    dex_contract: contractId,
    target_stx: "2000",
  };

  // Render the template
  return eta.render("token.tmpl", data);
}

async function GeneratePoolContract(
  tokenSymbol: string,
): Promise<string> {
  // Initialize Eta
  const eta = new Eta({ views: path.join(__dirname, "templates") });

  // Generate variables
  const contractId = `${senderAddress}.${tokenSymbol.toLowerCase()}-aibtcdev-dex`;

  // Prepare template data
  const data = {
    bitflow_pool_trait: getTraitReference(network, "BITFLOW_POOL"),
    bitflow_sip10_trait: getTraitReference(network, "BITFLOW_SIP10"),
    bitflow_xyk_core_address: getAddressReference(network, "BITFLOW_CORE_ADDRESS"),
    dex_contract: contractId,
  };

  // Render the template
  return eta.render("pool.tmpl", data);
}

function GenerateBondingDexContract(
  tokenMaxSupply: string,
  tokenDecimals: string,
  senderAddress: string,
  tokenSymbol: string
): string {
  // Initialize Eta
  const eta = new Eta({ views: path.join(__dirname, "templates") });

  const tokenContract = `${senderAddress}.${tokenSymbol.toLowerCase()}-aibtcdev`;
  const poolContract = `${senderAddress}.xyz-pool-stx-${tokenSymbol.toLowerCase()}-v-1-1`;

  const decimals = parseInt(tokenDecimals, 10);
  const maxSupply = parseInt(tokenMaxSupply, 10);

  // Calculate the actual max supply
  const calculatedMaxSupply = maxSupply * Math.pow(10, decimals);
  const stxTargetAmount = parseInt("2000000000", 10);

  const virtualSTXValue = Math.floor(stxTargetAmount / 5);
  const completeFee = Math.floor(stxTargetAmount * 0.02);

  // Prepare template data
  const data = {
    sip10_trait: getTraitReference(network, "SIP010_FT"),
    token_contract: tokenContract,
    pool_contract: poolContract,
    bitflow_fee_address: "SP31C60QVZKZ9CMMZX73TQ3F3ZZNS89YX2DCCFT8P",
    stx_contract: "SM1793C4R5PZ4NS4VQ4WMP7SKKYVH8JZEWSZ9HCCR.token-stx-v-1-2",
    token_max_supply: calculatedMaxSupply.toString(),
    token_decimals: tokenDecimals,
    creator: senderAddress,
    token_symbol: tokenSymbol,
    stx_target_amount: stxTargetAmount.toString(),
    virtual_stx_value: virtualSTXValue.toString(),
    complete_fee: completeFee.toString(),
  };

  // Render the template
  return eta.render("dex.tmpl", data);
}

async function deployContract(
  sourceCode: string,
  tokenSymbol: string,
  contractType: ContractType
): Promise<{ success: boolean; data?: any; error?: any }> {
  try {
    const contractNames: ContractNames = {
      [ContractType.TOKEN]: `${tokenSymbol}-aibtcdev`.toLowerCase(),
      [ContractType.POOL]: `xyk-pool-${tokenSymbol}-v-1-1`.toLowerCase(),
      [ContractType.DEX]: `${tokenSymbol}-aibtcdev-dex`.toLowerCase()
    };

    const nonceOffsets: { [key in ContractType]: number } = {
      [ContractType.TOKEN]: 0,
      [ContractType.POOL]: 1,
      [ContractType.DEX]: 2
    };

    const formattedContractName = contractNames[contractType];
    const theNextNonce = nextPossibleNonce + nonceOffsets[contractType];

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
      return {
        success: false,
        error: {
          message: broadcastResponse.error,
          reason: broadcastResponse.reason || null,
          details: broadcastResponse.reason_data || null
        }
      };
    } else {
      return {
        success: true,
        data: {
          contractPrincipal: `${address}.${formattedContractName}`,
          transactionId: `0x${broadcastResponse.txid}`,
          sender: address
        }
      };
    }
  } catch (error) {
    return {
      success: false,
      error: {
        message: `Error deploying contract: ${error}`,
        details: error
      }
    };
  }
}

async function main() {
  const tokenSymbol = process.argv[2];
  const tokenName = process.argv[3];
  const tokenMaxSupply = process.argv[4];
  const tokenDecimals = process.argv[5];
  const tokenUrl = process.argv[6];

  const result: DeploymentResult = {
    success: false,
    contracts: {
      token: null,
      pool: null,
      dex: null
    }
  };

  try {
    // Deploy Token Contract
    const bondingTokenContract = await GenerateBondingTokenContract(
      tokenSymbol,
      tokenName,
      tokenMaxSupply,
      tokenDecimals,
      tokenUrl,
      senderAddress
    );

    const tokenDeployResult = await deployContract(bondingTokenContract, tokenSymbol, ContractType.TOKEN);
    if (!tokenDeployResult.success) {
      result.error = {
        stage: "token",
        ...tokenDeployResult.error
      };
      console.log(JSON.stringify(result));
      process.exit(1);
    }
    result.contracts.token = tokenDeployResult.data;

    // Deploy Pool Contract
    const bondingPoolContract = await GeneratePoolContract(tokenSymbol);
    const poolDeployResult = await deployContract(bondingPoolContract, tokenSymbol, ContractType.POOL);
    if (!poolDeployResult.success) {
      result.error = {
        stage: "pool",
        ...poolDeployResult.error
      };
      console.log(JSON.stringify(result));
      process.exit(1);
    }
    result.contracts.pool = poolDeployResult.data;

    // Deploy DEX Contract
    const bondingDexContract = GenerateBondingDexContract(
      tokenMaxSupply,
      tokenDecimals,
      senderAddress,
      tokenSymbol
    );
    const dexDeployResult = await deployContract(bondingDexContract, tokenSymbol, ContractType.DEX);
    if (!dexDeployResult.success) {
      result.error = {
        stage: "dex",
        ...dexDeployResult.error
      };
      console.log(JSON.stringify(result));
      process.exit(1);
    }
    result.contracts.dex = dexDeployResult.data;

    // All deployments successful
    result.success = true;
    console.log(JSON.stringify(result));
  } catch (error) {
    result.error = {
      message: `Unexpected error: ${error}`,
      details: error
    };
    console.log(JSON.stringify(result));
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Error in main:", error);
  process.exit(1);
});