import { Eta } from "eta";
import * as path from "path";
import { getTraitReference, getAddressReference, getStxCityHash } from "../../utilities";
import { NetworkType } from "../../types";
import { ContractType, TraitType, GeneratedDaoContracts } from "../types/dao-types";
import { generateContractNames } from "../utils/contract-utils";

export class ContractGenerator {
  private eta: Eta;
  private network: NetworkType;
  private senderAddress: string;

  constructor(network: NetworkType, senderAddress: string) {
    this.eta = new Eta({ views: path.join(__dirname, "../templates/dao") });
    this.network = network;
    this.senderAddress = senderAddress;
  }

  async generateBondingTokenContract(
    tokenSymbol: string,
    tokenName: string,
    tokenMaxSupply: string,
    tokenDecimals: string,
    tokenUri: string,
  ): Promise<string> {
    const contractId = `${this.senderAddress}.${tokenSymbol.toLowerCase()}-aibtcdev-dex`;
    const decimals = parseInt(tokenDecimals, 10);
    const maxSupply = parseInt(tokenMaxSupply, 10);
    const calculatedMaxSupply = maxSupply * Math.pow(10, decimals);
    const hash = await getStxCityHash(contractId);

    const data = {
      sip10_trait: getTraitReference(this.network, "SIP10"),
      token_symbol: tokenSymbol,
      token_name: tokenName,
      token_max_supply: calculatedMaxSupply.toString(),
      token_decimals: tokenDecimals,
      token_uri: tokenUri,
      creator: this.senderAddress,
      dex_contract: contractId,
      stxctiy_token_deployment_fee_address: getAddressReference(this.network, "STXCITY_TOKEN_DEPLOYMENT_FEE"),
      target_stx: "2000",
    };

    return this.eta.render("token.clar", data);
  }

  async generatePoolContract(tokenSymbol: string): Promise<string> {
    const contractId = `${this.senderAddress}.${tokenSymbol.toLowerCase()}-aibtcdev-dex`;

    const data = {
      bitflow_pool_trait: getTraitReference(this.network, "BITFLOW_POOL"),
      sip10_trait: getTraitReference(this.network, "SIP10"),
      bitflow_xyk_core_address: getAddressReference(this.network, "BITFLOW_CORE"),
      dex_contract: contractId,
    };

    return this.eta.render("pool.clar", data);
  }

  generateBondingDexContract(
    tokenMaxSupply: string,
    tokenDecimals: string,
    tokenSymbol: string
  ): string {
    const tokenContract = `${this.senderAddress}.${tokenSymbol.toLowerCase()}-aibtcdev`;
    const poolContract = `${this.senderAddress}.xyz-pool-stx-${tokenSymbol.toLowerCase()}-v-1-1`;

    const decimals = parseInt(tokenDecimals, 10);
    const maxSupply = parseInt(tokenMaxSupply, 10);
    const calculatedMaxSupply = maxSupply * Math.pow(10, decimals);
    const stxTargetAmount = parseInt("2000000000", 10);
    const virtualSTXValue = Math.floor(stxTargetAmount / 5);
    const completeFee = Math.floor(stxTargetAmount * 0.02);

    const data = {
      sip10_trait: getTraitReference(this.network, "SIP10"),
      token_contract: tokenContract,
      pool_contract: poolContract,
      bitflow_fee_address: getAddressReference(this.network, "BITFLOW_FEE"),
      bitflow_stx_token_address: getAddressReference(this.network, "BITFLOW_STX_TOKEN"),
      token_max_supply: calculatedMaxSupply.toString(),
      token_decimals: tokenDecimals,
      creator: this.senderAddress,
      token_symbol: tokenSymbol,
      stx_target_amount: stxTargetAmount.toString(),
      virtual_stx_value: virtualSTXValue.toString(),
      complete_fee: completeFee.toString(),
      stxcity_dex_deployment_fee_address: getAddressReference(this.network, "STXCITY_DEX_DEPLOYMENT_FEE"),
    };

    return this.eta.render("dex.clar", data);
  }

  async generateDaoContracts(senderAddress: string, tokenSymbol: string): Promise<GeneratedDaoContracts> {

    // Get contract names from shared utility
    const contractNames = generateContractNames(tokenSymbol);

    // Construct contract addresses
    const baseDaoContractAddress = `${senderAddress}.${contractNames[ContractType.DAO_BASE]}`;
    const actionsContractAddress = `${senderAddress}.${contractNames[ContractType.DAO_ACTIONS]}`;
    const bankAccountContractAddress = `${senderAddress}.${contractNames[ContractType.DAO_BANK_ACCOUNT]}`;
    const directExecuteContractAddress = `${senderAddress}.${contractNames[ContractType.DAO_DIRECT_EXECUTE]}`;
    const messagingContractAddress = `${senderAddress}.${contractNames[ContractType.DAO_MESSAGING]}`;
    const paymentsContractAddress = `${senderAddress}.${contractNames[ContractType.DAO_PAYMENTS]}`;
    const treasuryContractAddress = `${senderAddress}.${contractNames[ContractType.DAO_TREASURY]}`;
    const bootstrapContractAddress = `${senderAddress}.${contractNames[ContractType.DAO_PROPOSAL_BOOTSTRAP]}`;

    const baseContract = await this.generateBaseDAOContract();
    const treasuryContract = await this.generateTreasuryContract(baseDaoContractAddress);
    const paymentsContract = await this.generatePaymentsContract(baseDaoContractAddress);
    const messagingContract = await this.generateMessagingContract(baseDaoContractAddress);
    const directExecuteContract = await this.generateDirectExecuteContract(baseDaoContractAddress);
    const bankAccountContract = await this.generateBankAccountContract(baseDaoContractAddress);
    const actionsContract = await this.generateActionsContract(baseDaoContractAddress);

    const bootstrapContract = await this.generateProposalsBootstrapContract(
      baseDaoContractAddress,
      actionsContractAddress,
      bankAccountContractAddress,
      directExecuteContractAddress,
      messagingContractAddress,
      paymentsContractAddress,
      treasuryContractAddress
    );

    return {
      base: {
        source: baseContract,
        name: contractNames[ContractType.DAO_BASE],
        type: ContractType.DAO_BASE,
        address: baseDaoContractAddress,
      },
      treasury: {
        source: treasuryContract,
        name: contractNames[ContractType.DAO_TREASURY],
        type: ContractType.DAO_TREASURY,
        address: treasuryContractAddress,
      },
      payments: {
        source: paymentsContract,
        name: contractNames[ContractType.DAO_PAYMENTS],
        type: ContractType.DAO_PAYMENTS,
        address: paymentsContractAddress,
      },
      messaging: {
        source: messagingContract,
        name: contractNames[ContractType.DAO_MESSAGING],
        type: ContractType.DAO_MESSAGING,
        address: messagingContractAddress,
      },
      directExecute: {
        source: directExecuteContract,
        name: contractNames[ContractType.DAO_DIRECT_EXECUTE],
        type: ContractType.DAO_DIRECT_EXECUTE,
        address: directExecuteContractAddress,
      },
      bankAccount: {
        source: bankAccountContract,
        name: contractNames[ContractType.DAO_BANK_ACCOUNT],
        type: ContractType.DAO_BANK_ACCOUNT,
        address: bankAccountContractAddress,
      },
      actions: {
        source: actionsContract,
        name: contractNames[ContractType.DAO_ACTIONS],
        type: ContractType.DAO_ACTIONS,
        address: actionsContractAddress,
      },
      bootstrap: {
        source: bootstrapContract,
        name: contractNames[ContractType.DAO_PROPOSAL_BOOTSTRAP],
        type: ContractType.DAO_PROPOSAL_BOOTSTRAP,
        address: bootstrapContractAddress,
      },
    };
  }

  private async generateBaseDAOContract(): Promise<string> {
    const data = {
      base_dao_trait: getTraitReference(this.network, "DAO_BASE"),
      proposal_trait: getTraitReference(this.network, "DAO_PROPOSAL"),
      extension_trait: getTraitReference(this.network, "DAO_EXTENSION"),
    };
    return this.eta.render("aibtcdev-base-dao.clar", data);
  }

  private async generateTreasuryContract(daoContractAddress: string): Promise<string> {
    const data = {
      dao_contract_address: daoContractAddress,
      extension_trait: getTraitReference(this.network, "DAO_EXTENSION"),
      treasury_trait: getTraitReference(this.network, "DAO_TREASURY"),
      sip10_trait: getTraitReference(this.network, "SIP10"),
      sip09_trait: getTraitReference(this.network, "SIP09"),
      pox_contract_address: getAddressReference(this.network, "POX"),
    };
    return this.eta.render("extensions/aibtc-ext006-treasury.clar", data);
  }

  private async generatePaymentsContract(
    daoContractAddress: string,
    bankAccountAddress?: string
  ): Promise<string> {
    const data = {
      dao_contract_address: daoContractAddress,
      bank_account_address: bankAccountAddress,
      extension_trait: getTraitReference(this.network, "DAO_EXTENSION"),
      payments_trait: getTraitReference(this.network, "DAO_PAYMENTS"),
    };
    return this.eta.render("extensions/aibtc-ext005-payments.clar", data);
  }

  private async generateMessagingContract(daoContractAddress: string): Promise<string> {
    const data = {
      dao_contract_address: daoContractAddress,
      extension_trait: getTraitReference(this.network, "DAO_EXTENSION"),
      messaging_trait: getTraitReference(this.network, "DAO_MESSAGING"),
    };
    return this.eta.render("extensions/aibtc-ext004-messaging.clar", data);
  }

  private async generateDirectExecuteContract(daoContractAddress: string): Promise<string> {
    const data = {
      dao_contract_address: daoContractAddress,
      extension_trait: getTraitReference(this.network, "DAO_EXTENSION"),
      direct_execute_trait: getTraitReference(this.network, "DAO_DIRECT_EXECUTE"),
    };
    return this.eta.render("extensions/aibtc-ext003-direct-execute.clar", data);
  }

  private async generateBankAccountContract(daoContractAddress: string): Promise<string> {
    const data = {
      dao_contract_address: daoContractAddress,
      extension_trait: getTraitReference(this.network, "DAO_EXTENSION"),
      bank_account_trait: getTraitReference(this.network, "DAO_BANK_ACCOUNT"),
    };
    return this.eta.render("extensions/aibtc-ext002-bank-account.clar", data);
  }

  private async generateActionsContract(daoContractAddress: string): Promise<string> {
    const data = {
      dao_contract_address: daoContractAddress,
      extension_trait: getTraitReference(this.network, "DAO_EXTENSION"),
    };
    return this.eta.render("extensions/aibtc-ext001-actions.clar", data);
  }

  private async generateProposalsBootstrapContract(daoContractAddress: string, actionsContractAddress: string, bankAccountContractAddress: string, directExecuteContractAddress: string, messagingContractAddress: string, paymentsContractAddress: string, treasuryContractAddress: string): Promise<string> {
    const data = {
      dao_contract_address: daoContractAddress,
      proposals_trait: getTraitReference(this.network, "DAO_PROPOSAL"),
      actions_contract_address: actionsContractAddress,
      bank_account_contract_address: bankAccountContractAddress,
      direct_execute_contract_address: directExecuteContractAddress,
      messaging_contract_address: messagingContractAddress,
      payments_contract_address: paymentsContractAddress,
      treasury_contract_address: treasuryContractAddress,
    };
    return this.eta.render("proposals/aibtc-prop001-bootstrap.clar", data);
  }

  async generateTraitContract(traitType: TraitType): Promise<string> {
    const data = {
      sip10_trait: getTraitReference(this.network, "SIP10"),
      sip09_trait: getTraitReference(this.network, "SIP09"),
      creator: this.senderAddress,
    };

    return this.eta.render(`traits/${traitType}.clar`, data);
  }
}
