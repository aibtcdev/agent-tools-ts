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
  getStxCityHash,
} from "../utilities";
import * as path from "path";
import { Eta } from "eta";

enum ContractType {
  TOKEN,
  POOL,
  DEX,
  DAO_BASE,
  DAO_ACTIONS,
  DAO_BANK_ACCOUNT,
  DAO_DIRECT_EXECUTE,
  DAO_MESSAGING,
  DAO_PAYMENTS,
  DAO_TREASURY,
  DAO_PROPOSAL_BOOTSTRAP,
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
    dao_base: any | null;
    dao_actions: any | null;
    dao_bank_account: any | null;
    dao_direct_execute: any | null;
    dao_messaging: any | null;
    dao_payments: any | null;
    dao_treasury: any | null;
    dao_proposal_bootstrap: any | null;
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

function getContractPrincipal(address: string, contractName: string): string {
  return `${address}.${contractName}`;
}

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
  const hash = await getStxCityHash(contractId);

  // Prepare template data
  const data = {
    sip10_trait: getTraitReference(network, "SIP10"),
    token_symbol: tokenSymbol,
    token_name: tokenName,
    token_max_supply: calculatedMaxSupply.toString(),
    token_decimals: tokenDecimals,
    token_uri: tokenUri,
    creator: senderAddress,
    dex_contract: contractId,
    stxctiy_token_deployment_fee_address: getAddressReference(network, "STXCITY_TOKEN_DEPLOYMENT_FEE"),
    target_stx: "2000",
  };

  // Render the template
  return eta.render("token.clar", data);
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
    sip10_trait: getTraitReference(network, "SIP10"),
    bitflow_xyk_core_address: getAddressReference(network, "BITFLOW_CORE"),
    dex_contract: contractId,
  };

  // Render the template
  return eta.render("pool.clar", data);
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
    sip10_trait: getTraitReference(network, "SIP10"),
    token_contract: tokenContract,
    pool_contract: poolContract,
    bitflow_fee_address: getAddressReference(network, "BITFLOW_FEE"),
    bitflow_stx_token_address: getAddressReference(network, "BITFLOW_STX_TOKEN"),
    token_max_supply: calculatedMaxSupply.toString(),
    token_decimals: tokenDecimals,
    creator: senderAddress,
    token_symbol: tokenSymbol,
    stx_target_amount: stxTargetAmount.toString(),
    virtual_stx_value: virtualSTXValue.toString(),
    complete_fee: completeFee.toString(),
    stxcity_dex_deployment_fee_address: getAddressReference(network, "STXCITY_DEX_DEPLOYMENT_FEE"),
  };

  // Render the template
  return eta.render("dex.clar", data);
}

async function GenerateBaseDAOContract(): Promise<string> {
  const data = {
    base_dao_trait: getTraitReference(network, "DAO_BASE"),
    proposal_trait: getTraitReference(network, "DAO_PROPOSAL"),
    extension_trait: getTraitReference(network, "DAO_EXTENSION"),
  };
  const eta = new Eta();
  return eta.render("aibtcdev-base-dao.clar", data);
}

async function GenerateTreasuryContract(
  dao_contract_address: string
): Promise<string> {
  const data = {
    dao_contract_address,
    extension_trait: getTraitReference(network, "DAO_EXTENSION"),
    treasury_trait: getTraitReference(network, "DAO_TREASURY"),
    sip10_trait: getTraitReference(network, "SIP10"),
    sip09_trait: getTraitReference(network, "SIP09"),
    pox_contract_address: getAddressReference(network, "POX"),
  };
  const eta = new Eta();
  return eta.render("aibtc-ext006-treasury.clar", data);
}

async function GeneratePaymentsContract(
  dao_contract_address: string,
  bank_account_address: string
): Promise<string> {
  const data = {
    dao_contract_address,
    bank_account_address,
    extension_trait: getTraitReference(network, "DAO_EXTENSION"),
    resources_trait: getTraitReference(network, "DAO_RESOURCES"),
    invoices_trait: getTraitReference(network, "DAO_INVOICES"),
  };
  const eta = new Eta();
  return eta.render("aibtc-ext005-payments.clar", data);
}

async function GenerateMessagingContract(
  dao_contract_address: string
): Promise<string> {
  const data = {
    dao_contract_address,
    extension_trait: getTraitReference(network, "DAO_EXTENSION"),
    messaging_trait: getTraitReference(network, "DAO_MESSAGING")
  };
  const eta = new Eta();
  return eta.render("aibtc-ext004-messaging.clar", data);
}

async function GenerateDirectExecuteContract(
  dao_contract_address: string
): Promise<string> {
  const data = {
    dao_contract_address,
    extension_trait: getTraitReference(network, "DAO_EXTENSION"),
    direct_execute_trait: getTraitReference(network, "DAO_DIRECT_EXECUTE"),
    sip10_trait: getTraitReference(network, "SIP10"),
    proposal_trait: getTraitReference(network, "DAO_PROPOSAL"),
    treasury_trait: getTraitReference(network, "DAO_TREASURY"),
  };
  const eta = new Eta();
  return eta.render("aibtc-ext003-direct-execute.clar", data);
}

async function GenerateBankAccountContract(
  dao_contract_address: string
): Promise<string> {
  const data = {
    dao_contract_address,
    extension_trait: getTraitReference(network, "DAO_EXTENSION"),
    bank_account_trait: getTraitReference(network, "DAO_BANK_ACCOUNT"),
  };
  const eta = new Eta();
  return eta.render("aibtc-ext002-bank-account.clar", data);
}

async function GenerateActionsContract(
  dao_contract_address: string
): Promise<string> {
  const data = {
    dao_contract_address,
    extension_trait: getTraitReference(network, "DAO_EXTENSION"),
    sip10_trait: getTraitReference(network, "SIP10"),
    treasury_trait: getTraitReference(network, "DAO_TREASURY"),
    messaging_trait: getTraitReference(network, "DAO_MESSAGING"),
    resources_trait: getTraitReference(network, "DAO_RESOURCES"),
  };
  const eta = new Eta();
  return eta.render("aibtc-ext001-actions.clar", data);
}

async function GenerateBootstrapProposalContract(
  dao_contract_address: string,
  actions_contract_address: string,
  bank_account_contract_address: string,
  direct_execute_contract_address: string,
  messaging_contract_address: string,
  payments_contract_address: string,
  treasury_contract_address: string
): Promise<string> {
  const data = {
    proposal_trait: getTraitReference(network, "DAO_PROPOSAL"),
    dao_contract_address,
    actions_contract_address,
    bank_account_contract_address,
    direct_execute_contract_address,
    messaging_contract_address,
    payments_contract_address,
    treasury_contract_address
  };
  const eta = new Eta();
  return eta.render("aibtc-prop001-bootstrap.clar", data);
}

function generateContractNames(tokenSymbol: string): ContractNames {
  return {
    [ContractType.TOKEN]: `${tokenSymbol}-aibtcdev`.toLowerCase(),
    [ContractType.POOL]: `xyk-pool-${tokenSymbol}-v-1-1`.toLowerCase(),
    [ContractType.DEX]: `${tokenSymbol}-aibtcdev-dex`.toLowerCase(),
    [ContractType.DAO_BASE]: `${tokenSymbol}-base-dao`.toLowerCase(),
    [ContractType.DAO_ACTIONS]: `${tokenSymbol}-ext001-actions`.toLowerCase(),
    [ContractType.DAO_BANK_ACCOUNT]: `${tokenSymbol}-ext002-bank-account`.toLowerCase(),
    [ContractType.DAO_DIRECT_EXECUTE]: `${tokenSymbol}-ext003-direct-execute`.toLowerCase(),
    [ContractType.DAO_MESSAGING]: `${tokenSymbol}-ext004-messaging`.toLowerCase(),
    [ContractType.DAO_PAYMENTS]: `${tokenSymbol}-ext005-payments`.toLowerCase(),
    [ContractType.DAO_TREASURY]: `${tokenSymbol}-ext006-treasury`.toLowerCase(),
    [ContractType.DAO_PROPOSAL_BOOTSTRAP]: `${tokenSymbol}-prop001-bootstrap`.toLowerCase(),
  };
}

async function deployContract(
  sourceCode: string,
  tokenSymbol: string,
  contractType: ContractType,
  contractNames: ContractNames
): Promise<{ success: boolean; data?: any; error?: any }> {
  try {
    const nonceOffsets: { [key in ContractType]: number } = {
      [ContractType.TOKEN]: 0,
      [ContractType.POOL]: 1,
      [ContractType.DEX]: 2,
      [ContractType.DAO_BASE]: 3,
      [ContractType.DAO_ACTIONS]: 4,
      [ContractType.DAO_BANK_ACCOUNT]: 5,
      [ContractType.DAO_DIRECT_EXECUTE]: 6,
      [ContractType.DAO_MESSAGING]: 7,
      [ContractType.DAO_PAYMENTS]: 8,
      [ContractType.DAO_TREASURY]: 9,
      [ContractType.DAO_PROPOSAL_BOOTSTRAP]: 10,
    };

    const theNextNonce = nextPossibleNonce + nonceOffsets[contractType];

    const txOptions: SignedContractDeployOptions = {
      contractName: contractNames[contractType],
      codeBody: sourceCode,
      clarityVersion: 2,
      network: networkObj,
      senderKey: key,
      nonce: theNextNonce,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      fee: BigInt(100_000), // 0.1 STX
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
          contractPrincipal: `${address}.${contractNames[contractType]}`,
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
      dex: null,
      dao_base: null,
      dao_actions: null,
      dao_bank_account: null,
      dao_direct_execute: null,
      dao_messaging: null,
      dao_payments: null,
      dao_treasury: null,
      dao_proposal_bootstrap: null
    }
  };

  try {
    // Generate contract names once
    const contractNames = generateContractNames(tokenSymbol);

    // Deploy Token Contract
    const bondingTokenContract = await GenerateBondingTokenContract(
      tokenSymbol,
      tokenName,
      tokenMaxSupply,
      tokenDecimals,
      tokenUrl,
      senderAddress
    );

    const tokenDeployResult = await deployContract(bondingTokenContract, tokenSymbol, ContractType.TOKEN, contractNames);
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
    const poolDeployResult = await deployContract(bondingPoolContract, tokenSymbol, ContractType.POOL, contractNames);
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
    const dexDeployResult = await deployContract(bondingDexContract, tokenSymbol, ContractType.DEX, contractNames);
    if (!dexDeployResult.success) {
      result.error = {
        stage: "dex",
        ...dexDeployResult.error
      };
      console.log(JSON.stringify(result));
      process.exit(1);
    }
    result.contracts.dex = dexDeployResult.data;

    // Deploy Base DAO Contract
    const baseDAOContract = await GenerateBaseDAOContract();
    const baseDAODeployResult = await deployContract(baseDAOContract, tokenSymbol, ContractType.DAO_BASE, contractNames);
    if (!baseDAODeployResult.success) {
      result.error = {
        stage: "dao_base",
        ...baseDAODeployResult.error
      };
      console.log(JSON.stringify(result));
      process.exit(1);
    }
    result.contracts.dao_base = baseDAODeployResult.data;

    // Deploy Actions Contract
    const actionsContract = await GenerateActionsContract(
      getContractPrincipal(address, contractNames[ContractType.DAO_BASE])
    );
    const actionsDeployResult = await deployContract(actionsContract, tokenSymbol, ContractType.DAO_ACTIONS, contractNames);
    if (!actionsDeployResult.success) {
      result.error = {
        stage: "dao_actions",
        ...actionsDeployResult.error
      };
      console.log(JSON.stringify(result));
      process.exit(1);
    }
    result.contracts.dao_actions = actionsDeployResult.data;

    // Deploy Bank Account Contract
    const bankAccountContract = await GenerateBankAccountContract(
      getContractPrincipal(address, contractNames[ContractType.DAO_BASE])
    );
    const bankAccountDeployResult = await deployContract(bankAccountContract, tokenSymbol, ContractType.DAO_BANK_ACCOUNT, contractNames);
    if (!bankAccountDeployResult.success) {
      result.error = {
        stage: "dao_bank_account",
        ...bankAccountDeployResult.error
      };
      console.log(JSON.stringify(result));
      process.exit(1);
    }
    result.contracts.dao_bank_account = bankAccountDeployResult.data;

    // Deploy Direct Execute Contract
    const directExecuteContract = await GenerateDirectExecuteContract(
      getContractPrincipal(address, contractNames[ContractType.DAO_BASE])
    );
    const directExecuteDeployResult = await deployContract(directExecuteContract, tokenSymbol, ContractType.DAO_DIRECT_EXECUTE, contractNames);
    if (!directExecuteDeployResult.success) {
      result.error = {
        stage: "dao_direct_execute",
        ...directExecuteDeployResult.error
      };
      console.log(JSON.stringify(result));
      process.exit(1);
    }
    result.contracts.dao_direct_execute = directExecuteDeployResult.data;

    // Deploy Messaging Contract
    const messagingContract = await GenerateMessagingContract(
      getContractPrincipal(address, contractNames[ContractType.DAO_BASE])
    );
    const messagingDeployResult = await deployContract(messagingContract, tokenSymbol, ContractType.DAO_MESSAGING, contractNames);
    if (!messagingDeployResult.success) {
      result.error = {
        stage: "dao_messaging",
        ...messagingDeployResult.error
      };
      console.log(JSON.stringify(result));
      process.exit(1);
    }
    result.contracts.dao_messaging = messagingDeployResult.data;

    // Deploy Payments Contract
    const paymentsContract = await GeneratePaymentsContract(
      getContractPrincipal(address, contractNames[ContractType.DAO_BASE]),
      getContractPrincipal(address, contractNames[ContractType.DAO_BANK_ACCOUNT])
    );
    const paymentsDeployResult = await deployContract(paymentsContract, tokenSymbol, ContractType.DAO_PAYMENTS, contractNames);
    if (!paymentsDeployResult.success) {
      result.error = {
        stage: "dao_payments",
        ...paymentsDeployResult.error
      };
      console.log(JSON.stringify(result));
      process.exit(1);
    }
    result.contracts.dao_payments = paymentsDeployResult.data;

    // Deploy Treasury Contract
    const treasuryContract = await GenerateTreasuryContract(
      getContractPrincipal(address, contractNames[ContractType.DAO_BASE]),
    );
    const treasuryDeployResult = await deployContract(treasuryContract, tokenSymbol, ContractType.DAO_TREASURY, contractNames);
    if (!treasuryDeployResult.success) {
      result.error = {
        stage: "dao_treasury",
        ...treasuryDeployResult.error
      };
      console.log(JSON.stringify(result));
      process.exit(1);
    }
    result.contracts.dao_treasury = treasuryDeployResult.data;

    // Deploy Bootstrap Proposal Contract
    const bootstrapContract = await GenerateBootstrapProposalContract(
      getContractPrincipal(address, contractNames[ContractType.DAO_BASE]),
      getContractPrincipal(address, contractNames[ContractType.DAO_ACTIONS]),
      getContractPrincipal(address, contractNames[ContractType.DAO_BANK_ACCOUNT]),
      getContractPrincipal(address, contractNames[ContractType.DAO_DIRECT_EXECUTE]),
      getContractPrincipal(address, contractNames[ContractType.DAO_MESSAGING]),
      getContractPrincipal(address, contractNames[ContractType.DAO_PAYMENTS]),
      getContractPrincipal(address, contractNames[ContractType.DAO_TREASURY])
    );
    const bootstrapDeployResult = await deployContract(bootstrapContract, tokenSymbol, ContractType.DAO_PROPOSAL_BOOTSTRAP, contractNames);
    if (!bootstrapDeployResult.success) {
      result.error = {
        stage: "dao_proposal_bootstrap",
        ...bootstrapDeployResult.error
      };
      console.log(JSON.stringify(result));
      process.exit(1);
    }
    result.contracts.dao_proposal_bootstrap = bootstrapDeployResult.data;

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