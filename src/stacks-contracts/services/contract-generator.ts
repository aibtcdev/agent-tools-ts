import { Eta } from "eta";
import * as path from "path";
import {
  getTraitReference,
  getAddressReference,
  getStxCityHash,
} from "../../utilities";
import { NetworkType } from "../../types";
import {
  ContractType,
  TraitType,
  GeneratedDaoContracts,
} from "../types/dao-types";
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

  // aibtcdev-base-dao
  private generateBaseDAOContract(): string {
    const data = {
      base_dao_trait: getTraitReference(this.network, "DAO_BASE"),
      proposal_trait: getTraitReference(this.network, "DAO_PROPOSAL"),
      extension_trait: getTraitReference(this.network, "DAO_EXTENSION"),
    };
    return this.eta.render("aibtcdev-base-dao.clar", data);
  }

  // extension: aibtc-action-proposals
  private generateActionProposalsContract(daoContractAddress: string): string {
    const data = {
      dao_contract_address: daoContractAddress,
      extension_trait: getTraitReference(this.network, "DAO_EXTENSION"),
      action_proposals_trait: getTraitReference(
        this.network,
        "DAO_ACTION_PROPOSALS"
      ),
      sip10_trait: getTraitReference(this.network, "SIP10"),
      treasury_trait: getTraitReference(this.network, "DAO_TREASURY"),
      action_trait: getTraitReference(this.network, "DAO_ACTION"),
    };
    return this.eta.render("extensions/aibtc-action-proposals.clar", data);
  }

  // extension: aibtc-bank-account
  private generateBankAccountContract(daoContractAddress: string): string {
    const data = {
      dao_contract_address: daoContractAddress,
      extension_trait: getTraitReference(this.network, "DAO_EXTENSION"),
      bank_account_trait: getTraitReference(this.network, "DAO_BANK_ACCOUNT"),
    };
    return this.eta.render("extensions/aibtc-bank-account.clar", data);
  }

  // extension: aibtc-bitflow-pool
  // generated at runtime based on script parameters
  generateBitflowPoolContract(tokenSymbol: string): string {
    const contractId = `${
      this.senderAddress
    }.${tokenSymbol.toLowerCase()}-stxcity-dex`;

    const data = {
      dao_bitflow_pool_trait: getTraitReference(
        this.network,
        "DAO_BITFLOW_POOL"
      ),
      bitflow_pool_trait: getTraitReference(this.network, "BITFLOW_POOL"),
      sip10_trait: getTraitReference(this.network, "SIP10"),
      bitflow_xyk_core_address: getAddressReference(
        this.network,
        "BITFLOW_CORE"
      ),
      dex_contract: contractId,
    };

    return this.eta.render("extensions/aibtc-bitflow-pool.clar", data);
  }

  // extension: aibtc-core-proposals
  private generateCorePropasalsContract(daoContractAddress: string): string {
    const data = {
      dao_contract_address: daoContractAddress,
      extension_trait: getTraitReference(this.network, "DAO_EXTENSION"),
      core_proposal_trait: getTraitReference(
        this.network,
        "DAO_CORE_PROPOSALS"
      ),
      sip10_trait: getTraitReference(this.network, "SIP10"),
      proposal_trait: getTraitReference(this.network, "DAO_PROPOSAL"),
      treasury_trait: getTraitReference(this.network, "DAO_TREASURY"),
    };
    return this.eta.render("extensions/aibtc-core-proposals.clar", data);
  }

  // extension: aibtc-onchain-messaging
  private generateMessagingContract(daoContractAddress: string): string {
    const data = {
      dao_contract_address: daoContractAddress,
      extension_trait: getTraitReference(this.network, "DAO_EXTENSION"),
      messaging_trait: getTraitReference(this.network, "DAO_MESSAGING"),
    };
    return this.eta.render("extensions/aibtc-onchain-messaging.clar", data);
  }

  // extension: aibtc-payments-invoices
  private generatePaymentsInvoicesContract(
    daoContractAddress: string,
    bankAccountAddress: string
  ): string {
    const data = {
      dao_contract_address: daoContractAddress,
      bank_account_address: bankAccountAddress,
      extension_trait: getTraitReference(this.network, "DAO_EXTENSION"),
      invoices_trait: getTraitReference(this.network, "DAO_INVOICES"),
      resources_trait: getTraitReference(this.network, "DAO_RESOURCES"),
    };
    return this.eta.render("extensions/aibtc-payments-invoices.clar", data);
  }

  // extension: aibtc-token-dex (bonding curve)
  // generated at runtime based on script parameters
  generateTokenDexContract(
    tokenMaxSupply: string,
    tokenDecimals: string,
    tokenSymbol: string
  ): string {
    const tokenContract = `${
      this.senderAddress
    }.${tokenSymbol.toLowerCase()}-stxcity`;
    const poolContract = `${
      this.senderAddress
    }.xyk-pool-stx-${tokenSymbol.toLowerCase()}-v-1-1`;

    const decimals = parseInt(tokenDecimals, 10);
    const maxSupply = parseInt(tokenMaxSupply, 10);
    const calculatedMaxSupply = maxSupply * Math.pow(10, decimals);
    const stxTargetAmount = parseInt("2000000000", 10);
    const virtualSTXValue = Math.floor(stxTargetAmount / 5);
    const completeFee = Math.floor(stxTargetAmount * 0.02);

    const data = {
      stxcity_swap_fee: getAddressReference(this.network, "STXCITY_SWAP_FEE"),
      stxcity_complete_fee: getAddressReference(
        this.network,
        "STXCITY_COMPLETE_FEE"
      ),
      burn: getAddressReference(this.network, "BURN"),
      bitflow_core_contract: getAddressReference(this.network, "BITFLOW_CORE"),
      sip10_trait: getTraitReference(this.network, "SIP10"),
      token_dex_trait: getTraitReference(this.network, "DAO_TOKEN_DEX"),
      token_contract: tokenContract,
      pool_contract: poolContract,
      bitflow_fee_address: getAddressReference(this.network, "BITFLOW_FEE"),
      bitflow_stx_token_address: getAddressReference(
        this.network,
        "BITFLOW_STX_TOKEN"
      ),
      token_max_supply: calculatedMaxSupply.toString(),
      token_decimals: tokenDecimals,
      creator: this.senderAddress,
      token_symbol: tokenSymbol,
      stx_target_amount: stxTargetAmount.toString(),
      virtual_stx_value: virtualSTXValue.toString(),
      complete_fee: completeFee.toString(),
      stxcity_dex_deployment_fee_address: getAddressReference(
        this.network,
        "STXCITY_DEX_DEPLOYMENT_FEE"
      ),
    };

    return this.eta.render("extensions/aibtc-token-dex.clar", data);
  }

  // extension: aibtc-token-owner
  private generateTokenOwnerContract(
    daoContractAddress: string,
    tokenSymbol: string
  ): string {
    const tokenContract = `${
      this.senderAddress
    }.${tokenSymbol.toLowerCase()}-stxcity`;
    const data = {
      dao_contract_address: daoContractAddress,
      token_contract: tokenContract,
      extension_trait: getTraitReference(this.network, "DAO_EXTENSION"),
      token_owner_trait: getTraitReference(this.network, "DAO_TOKEN_OWNER"),
      creator: this.senderAddress,
    };
    return this.eta.render("extensions/aibtc-token-owner.clar", data);
  }

  // extension: aibtc-token (h/t stxcity)
  // generated at runtime based on script parameters
  // async due to querying the stxcity hash
  async generateTokenContract(
    tokenSymbol: string,
    tokenName: string,
    tokenMaxSupply: string,
    tokenDecimals: string,
    tokenUri: string
  ): Promise<string> {
    const contractId = `${
      this.senderAddress
    }.${tokenSymbol.toLowerCase()}-stxcity-dex`;
    const treasuryContractId = `${
      this.senderAddress
    }.${tokenSymbol.toLowerCase()}-treasury`;
    const tokenOwnerContractId = `${
      this.senderAddress
    }.${tokenSymbol.toLowerCase()}-token-owner`;
    const decimals = parseInt(tokenDecimals, 10);
    const maxSupply = parseInt(tokenMaxSupply, 10);
    const calculatedMaxSupply = maxSupply * Math.pow(10, decimals);
    const hash = await getStxCityHash(contractId);

    const data = {
      hash,
      sip10_trait: getTraitReference(this.network, "SIP10"),
      token_trait: getTraitReference(this.network, "DAO_TOKEN"),
      token_owner: tokenOwnerContractId,
      token_symbol: tokenSymbol,
      token_name: tokenName,
      token_max_supply: calculatedMaxSupply.toString(),
      token_decimals: tokenDecimals,
      token_uri: tokenUri,
      creator: this.senderAddress,
      dex_contract: contractId,
      treasury_contract: treasuryContractId,
      stxctiy_token_deployment_fee_address: getAddressReference(
        this.network,
        "STXCITY_TOKEN_DEPLOYMENT_FEE"
      ),
      target_stx: "2000",
    };

    return this.eta.render("extensions/aibtc-token.clar", data);
  }

  // extension: aibtc-treasury
  private generateTreasuryContract(daoContractAddress: string): string {
    const data = {
      dao_contract_address: daoContractAddress,
      extension_trait: getTraitReference(this.network, "DAO_EXTENSION"),
      treasury_trait: getTraitReference(this.network, "DAO_TREASURY"),
      sip10_trait: getTraitReference(this.network, "SIP10"),
      sip09_trait: getTraitReference(this.network, "SIP09"),
      pox_contract_address: getAddressReference(this.network, "POX"),
    };
    return this.eta.render("extensions/aibtc-treasury.clar", data);
  }

  // proposal: aibtc-base-bootstrap-initialization
  private generateProposalsBootstrapContract(
    daoContractAddress: string,
    daoManifest: string,
    actionProposalsContractAddress: string,
    bankAccountContractAddress: string,
    coreProposalsContractAddress: string,
    messagingContractAddress: string,
    paymentsContractAddress: string,
    tokenOwnerContractAddress: string,
    treasuryContractAddress: string
  ): string {
    const data = {
      dao_contract_address: daoContractAddress,
      dao_manifest: daoManifest,
      proposals_trait: getTraitReference(this.network, "DAO_PROPOSAL"),
      actions_contract_address: actionProposalsContractAddress,
      bank_account_contract_address: bankAccountContractAddress,
      core_proposals_contract_address: coreProposalsContractAddress,
      messaging_contract_address: messagingContractAddress,
      payments_contract_address: paymentsContractAddress,
      token_owner_contract_address: tokenOwnerContractAddress,
      treasury_contract_address: treasuryContractAddress,
    };
    return this.eta.render(
      "proposals/aibtc-base-bootstrap-initialization.clar",
      data
    );
  }

  // generate all contracts necessary to deploy and init the dao
  // generated at runtime based on script parameters
  generateDaoContracts(
    senderAddress: string,
    tokenSymbol: string
  ): GeneratedDaoContracts {
    // Get contract names from shared utility
    const contractNames = generateContractNames(tokenSymbol);

    // Construct contract addresses
    const baseDaoContractAddress = `${senderAddress}.${
      contractNames[ContractType.DAO_BASE]
    }`;
    const actionProposalsContractAddress = `${senderAddress}.${
      contractNames[ContractType.DAO_ACTION_PROPOSALS]
    }`;
    const bankAccountContractAddress = `${senderAddress}.${
      contractNames[ContractType.DAO_BANK_ACCOUNT]
    }`;
    const coreProposalsContractAddress = `${senderAddress}.${
      contractNames[ContractType.DAO_CORE_PROPOSALS]
    }`;
    const messagingContractAddress = `${senderAddress}.${
      contractNames[ContractType.DAO_MESSAGING]
    }`;
    const paymentsContractAddress = `${senderAddress}.${
      contractNames[ContractType.DAO_PAYMENTS]
    }`;
    const tokenOwnerContractAddress = `${senderAddress}.${
      contractNames[ContractType.DAO_TOKEN_OWNER]
    }`;
    const treasuryContractAddress = `${senderAddress}.${
      contractNames[ContractType.DAO_TREASURY]
    }`;
    const bootstrapContractAddress = `${senderAddress}.${
      contractNames[ContractType.DAO_PROPOSAL_BOOTSTRAP]
    }`;

    const baseContract = this.generateBaseDAOContract();
    const bankAccountContract = this.generateBankAccountContract(
      baseDaoContractAddress
    );
    const treasuryContract = this.generateTreasuryContract(
      baseDaoContractAddress
    );
    const paymentsInvoicesContract = this.generatePaymentsInvoicesContract(
      baseDaoContractAddress,
      bankAccountContractAddress
    );
    const messagingContract = this.generateMessagingContract(
      baseDaoContractAddress
    );
    const coreProposalsContract = this.generateCorePropasalsContract(
      baseDaoContractAddress
    );
    const actionProposalsContract = this.generateActionProposalsContract(
      baseDaoContractAddress
    );
    const tokenOwnerContract = this.generateTokenOwnerContract(
      baseDaoContractAddress,
      tokenSymbol
    );

    const daoManifest = "This is where the dao manifest would go";

    const bootstrapContract = this.generateProposalsBootstrapContract(
      baseDaoContractAddress,
      daoManifest,
      actionProposalsContractAddress,
      bankAccountContractAddress,
      coreProposalsContractAddress,
      messagingContractAddress,
      paymentsContractAddress,
      tokenOwnerContractAddress,
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
        source: paymentsInvoicesContract,
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
      coreProposals: {
        source: coreProposalsContract,
        name: contractNames[ContractType.DAO_CORE_PROPOSALS],
        type: ContractType.DAO_CORE_PROPOSALS,
        address: coreProposalsContractAddress,
      },
      bankAccount: {
        source: bankAccountContract,
        name: contractNames[ContractType.DAO_BANK_ACCOUNT],
        type: ContractType.DAO_BANK_ACCOUNT,
        address: bankAccountContractAddress,
      },
      actionProposals: {
        source: actionProposalsContract,
        name: contractNames[ContractType.DAO_ACTION_PROPOSALS],
        type: ContractType.DAO_ACTION_PROPOSALS,
        address: actionProposalsContractAddress,
      },
      tokenOwner: {
        source: tokenOwnerContract,
        name: contractNames[ContractType.DAO_TOKEN_OWNER],
        type: ContractType.DAO_TOKEN_OWNER,
        address: tokenOwnerContractAddress,
      },
      bootstrap: {
        source: bootstrapContract,
        name: contractNames[ContractType.DAO_PROPOSAL_BOOTSTRAP],
        type: ContractType.DAO_PROPOSAL_BOOTSTRAP,
        address: bootstrapContractAddress,
      },
    };
  }

  // helper function to generate trait contracts
  // generated at runtime based on script parameters
  generateTraitContract(traitType: TraitType): string {
    const data = {
      sip10_trait: getTraitReference(this.network, "SIP10"),
      sip09_trait: getTraitReference(this.network, "SIP09"),
      creator: this.senderAddress,
    };

    return this.eta.render(`traits/${traitType}.clar`, data);
  }
}
