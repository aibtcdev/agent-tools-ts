import { Eta } from "eta";
import * as path from "path";
import {
  getTraitReference,
  getAddressReference,
  getStxCityHash,
  FaktoryGeneratedContracts,
  getFaktoryContracts,
} from "../../utilities";
import { NetworkType } from "../../types";
import {
  ContractType,
  TraitType,
  GeneratedDaoContracts,
  ContractActionType,
  ContractProposalType,
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
  private generateActionProposalsContract(
    daoContractAddress: string,
    tokenContractAddress: string,
    tokenDexContractAddress: string,
    tokenPoolContractAddress: string,
    treasuryContractAddress: string
  ): string {
    const data = {
      dao_contract_address: daoContractAddress,
      token_contract_address: tokenContractAddress,
      token_dex_contract_address: tokenDexContractAddress,
      token_pool_contract_address: tokenPoolContractAddress,
      treasury_contract_address: treasuryContractAddress,
      extension_trait: getTraitReference(this.network, "DAO_EXTENSION"),
      action_proposals_trait: getTraitReference(
        this.network,
        "DAO_ACTION_PROPOSALS"
      ),
      sip10_trait: getTraitReference(this.network, "SIP10"),
      treasury_trait: getTraitReference(this.network, "DAO_TREASURY"),
      action_trait: getTraitReference(this.network, "DAO_ACTION"),
    };
    return this.eta.render("extensions/aibtc-action-proposals-v2.clar", data);
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
      sip10_trait: getTraitReference(this.network, "BITFLOW_SIP010"),
      bitflow_xyk_core_address: getAddressReference(
        this.network,
        "BITFLOW_CORE"
      ),
      dex_contract: contractId,
    };

    return this.eta.render("extensions/aibtc-bitflow-pool.clar", data);
  }

  // extension: aibtc-core-proposals
  private generateCorePropasalsContract(
    daoContractAddress: string,
    tokenContractAddress: string,
    tokenDexContractAddress: string,
    tokenPoolContractAddress: string,
    treasuryContractAddress: string
  ): string {
    const data = {
      dao_contract_address: daoContractAddress,
      token_contract_address: tokenContractAddress,
      token_dex_contract_address: tokenDexContractAddress,
      token_pool_contract_address: tokenPoolContractAddress,
      treasury_contract_address: treasuryContractAddress,
      extension_trait: getTraitReference(this.network, "DAO_EXTENSION"),
      core_proposal_trait: getTraitReference(
        this.network,
        "DAO_CORE_PROPOSALS"
      ),
      sip10_trait: getTraitReference(this.network, "SIP10"),
      proposal_trait: getTraitReference(this.network, "DAO_PROPOSAL"),
      treasury_trait: getTraitReference(this.network, "DAO_TREASURY"),
    };
    return this.eta.render("extensions/aibtc-core-proposals-v2.clar", data);
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

    // Constants for bonding curve calculations
    const VIRTUAL_STX_RATIO = 0.2; // 1/5 of target STX amount
    const TARGET_STX_AMOUNT = 2000000000; // 2000 STX in microSTX
    const FEE_PERCENTAGE = 0.02; // 2% fee

    // Calculate virtual STX value (1/5 of target amount)
    const virtualSTXValue = Math.floor(TARGET_STX_AMOUNT * VIRTUAL_STX_RATIO);

    // Calculate complete fee (2% of target amount)
    const completeFee = Math.floor(TARGET_STX_AMOUNT * FEE_PERCENTAGE);

    // Calculate initial token balance for DEX (20% of total supply)
    const dex_contract_mint_amount = Math.floor(calculatedMaxSupply * 0.2);

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
      token_contract_address: tokenContract,
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
      stx_target_amount: TARGET_STX_AMOUNT.toString(),
      dex_contract_mint_amount: dex_contract_mint_amount.toString(),
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
    tokenContractAddress: string
  ): string {
    const data = {
      dao_contract_address: daoContractAddress,
      token_contract_address: tokenContractAddress,
      extension_trait: getTraitReference(this.network, "DAO_EXTENSION"),
      token_owner_trait: getTraitReference(this.network, "DAO_TOKEN_OWNER"),
      creator: this.senderAddress,
    };
    return this.eta.render("extensions/aibtc-token-owner.clar", data);
  }

  // extension: aibtc-token-faktory (h/t fak.fun)
  // extension: aibtc-token-faktory-dex (h/t fak.fun)
  // extension: aibtc-bitflow-pool (h/t fak.fun)
  // generated at runtime based on script parameters
  // async due to querying fak.fun contract generator
  async generateFaktoryContracts(
    tokenSymbol: string,
    tokenName: string,
    tokenMaxSupply: string,
    tokenUri: string,
    creatorAddress: string,
    originAddress: string,
    logoUrl?: string,
    description?: string,
    tweetOrigin?: string
  ): Promise<FaktoryGeneratedContracts> {
    const { token, dex, pool } = await getFaktoryContracts(
      tokenSymbol,
      tokenName,
      parseInt(tokenMaxSupply),
      creatorAddress,
      originAddress,
      tokenUri,
      logoUrl,
      description,
      tweetOrigin
    );
    return { token, dex, pool };
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
    const dex_contract_mint_amount = calculatedMaxSupply * 0.2;
    const treasury_contract_mint_amount = calculatedMaxSupply * 0.8;
    const hash = await getStxCityHash(contractId);

    const data = {
      hash,
      sip10_trait: getTraitReference(this.network, "SIP10"),
      token_trait: getTraitReference(this.network, "DAO_TOKEN"),
      token_owner: tokenOwnerContractId,
      token_symbol: tokenSymbol,
      token_name: tokenName,
      token_max_supply: calculatedMaxSupply.toString(),
      dex_contract_mint_amount: dex_contract_mint_amount.toString(),
      treasury_contract_mint_amount: treasury_contract_mint_amount.toString(),
      token_decimals: tokenDecimals,
      token_uri: tokenUri,
      creator: this.senderAddress,
      dex_contract: contractId,
      treasury_contract: treasuryContractId,
      stxcity_token_deployment_fee_address: getAddressReference(
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

  // action extension: aibtc-action-add-resource
  private generateActionAddResourceContract(
    daoContractAddress: string,
    paymentsContractAddress: string
  ): string {
    const data = {
      extension_trait: getTraitReference(this.network, "DAO_EXTENSION"),
      action_trait: getTraitReference(this.network, "DAO_ACTION"),
      dao_contract_address: daoContractAddress,
      payments_contract_address: paymentsContractAddress,
    };
    return this.eta.render(
      "extensions/actions/aibtc-action-add-resource.clar",
      data
    );
  }

  // action extension: aibtc-action-allow-asset
  private generateActionAllowAssetContract(
    daoContractAddress: string,
    treasuryContractAddress: string
  ): string {
    const data = {
      extension_trait: getTraitReference(this.network, "DAO_EXTENSION"),
      action_trait: getTraitReference(this.network, "DAO_ACTION"),
      dao_contract_address: daoContractAddress,
      treasury_contract_address: treasuryContractAddress,
    };
    return this.eta.render(
      "extensions/actions/aibtc-action-allow-asset.clar",
      data
    );
  }

  // action extension: aibtc-action-send-message
  private generateActionSendMessageContract(
    daoContractAddress: string,
    messagingContractAddress: string
  ): string {
    const data = {
      extension_trait: getTraitReference(this.network, "DAO_EXTENSION"),
      action_trait: getTraitReference(this.network, "DAO_ACTION"),
      dao_contract_address: daoContractAddress,
      messaging_contract_address: messagingContractAddress,
    };
    return this.eta.render(
      "extensions/actions/aibtc-action-send-message.clar",
      data
    );
  }

  // action extension: aibtc-action-set-account-holder
  private generateActionSetAccountHolderContract(
    daoContractAddress: string,
    bankAccountContractAddress: string
  ): string {
    const data = {
      extension_trait: getTraitReference(this.network, "DAO_EXTENSION"),
      action_trait: getTraitReference(this.network, "DAO_ACTION"),
      dao_contract_address: daoContractAddress,
      bank_account_contract_address: bankAccountContractAddress,
    };
    return this.eta.render(
      "extensions/actions/aibtc-action-set-account-holder.clar",
      data
    );
  }

  // action extension: aibtc-action-set-withdrawal-amount
  private generateActionSetWithdrawalAmountContract(
    daoContractAddress: string,
    bankAccountContractAddress: string
  ): string {
    const data = {
      extension_trait: getTraitReference(this.network, "DAO_EXTENSION"),
      action_trait: getTraitReference(this.network, "DAO_ACTION"),
      dao_contract_address: daoContractAddress,
      bank_account_contract_address: bankAccountContractAddress,
    };
    return this.eta.render(
      "extensions/actions/aibtc-action-set-withdrawal-amount.clar",
      data
    );
  }

  // action extension: aibtc-action-set-withdrawal-period
  private generateActionSetWithdrawalPeriodContract(
    daoContractAddress: string,
    bankAccountContractAddress: string
  ): string {
    const data = {
      extension_trait: getTraitReference(this.network, "DAO_EXTENSION"),
      action_trait: getTraitReference(this.network, "DAO_ACTION"),
      dao_contract_address: daoContractAddress,
      bank_account_contract_address: bankAccountContractAddress,
    };
    return this.eta.render(
      "extensions/actions/aibtc-action-set-withdrawal-period.clar",
      data
    );
  }

  // action extension: aibtc-action-toggle-resource
  private generateActionToggleResourceContract(
    daoContractAddress: string,
    paymentsContractAddress: string
  ): string {
    const data = {
      extension_trait: getTraitReference(this.network, "DAO_EXTENSION"),
      action_trait: getTraitReference(this.network, "DAO_ACTION"),
      dao_contract_address: daoContractAddress,
      payments_contract_address: paymentsContractAddress,
    };
    return this.eta.render(
      "extensions/actions/aibtc-action-toggle-resource.clar",
      data
    );
  }

  // proposal: aibtc-base-bootstrap-initialization
  private generateProposalsBootstrapContract(
    daoManifest: string,
    tokenContractAddress: string,
    daoContractAddress: string,
    actionProposalsContractAddress: string,
    bankAccountContractAddress: string,
    coreProposalsContractAddress: string,
    messagingContractAddress: string,
    paymentsContractAddress: string,
    tokenOwnerContractAddress: string,
    treasuryContractAddress: string,
    actionAddResourceContractAddress: string,
    actionAllowAssetContractAddress: string,
    actionSendMessageContractAddress: string,
    actionSetAccountHolderContractAddress: string,
    actionSetWithdrawalAmountContractAddress: string,
    actionSetWithdrawalPeriodContractAddress: string,
    actionToggleResourceContractAddress: string
  ): string {
    const data = {
      dao_manifest: daoManifest,
      token_contract_address: tokenContractAddress,
      dao_contract_address: daoContractAddress,
      proposals_trait: getTraitReference(this.network, "DAO_PROPOSAL"),
      action_proposals_contract_address: actionProposalsContractAddress,
      bank_account_contract_address: bankAccountContractAddress,
      core_proposals_contract_address: coreProposalsContractAddress,
      messaging_contract_address: messagingContractAddress,
      payments_contract_address: paymentsContractAddress,
      token_owner_contract_address: tokenOwnerContractAddress,
      treasury_contract_address: treasuryContractAddress,
      action_add_resource_contract_address: actionAddResourceContractAddress,
      action_allow_asset_contract_address: actionAllowAssetContractAddress,
      action_send_message_contract_address: actionSendMessageContractAddress,
      action_set_account_holder_contract_address:
        actionSetAccountHolderContractAddress,
      action_set_withdrawal_amount_contract_address:
        actionSetWithdrawalAmountContractAddress,
      action_set_withdrawal_period_contract_address:
        actionSetWithdrawalPeriodContractAddress,
      action_toggle_resource_by_name_contract_address:
        actionToggleResourceContractAddress,
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
    tokenSymbol: string,
    daoManifest: string
  ): GeneratedDaoContracts {
    // get contract names using token symbol
    const contractNames = generateContractNames(tokenSymbol);

    const generateContractPrincipal = (
      contractType: ContractType | ContractActionType | ContractProposalType
    ) => `${senderAddress}.${contractNames[contractType]}`;

    // construct token related contract addresses
    const tokenContractAddress = generateContractPrincipal(
      ContractType.DAO_TOKEN
    );
    const tokenDexContractAddress = generateContractPrincipal(
      ContractType.DAO_TOKEN_DEX
    );
    const tokenPoolContractAddress = generateContractPrincipal(
      ContractType.DAO_BITFLOW_POOL
    );

    // construct base dao contract address
    const baseDaoContractAddress = generateContractPrincipal(
      ContractType.DAO_BASE
    );

    // construct extension contract addresses
    const actionProposalsContractAddress = generateContractPrincipal(
      ContractType.DAO_ACTION_PROPOSALS_V2
    );
    const bankAccountContractAddress = generateContractPrincipal(
      ContractType.DAO_BANK_ACCOUNT
    );
    const coreProposalsContractAddress = generateContractPrincipal(
      ContractType.DAO_CORE_PROPOSALS_V2
    );
    const messagingContractAddress = generateContractPrincipal(
      ContractType.DAO_MESSAGING
    );
    const paymentsContractAddress = generateContractPrincipal(
      ContractType.DAO_PAYMENTS
    );
    const tokenOwnerContractAddress = generateContractPrincipal(
      ContractType.DAO_TOKEN_OWNER
    );
    const treasuryContractAddress = generateContractPrincipal(
      ContractType.DAO_TREASURY
    );

    // construct action extension contract addresses
    const actionAddResourceContractAddress = generateContractPrincipal(
      ContractActionType.DAO_ACTION_ADD_RESOURCE
    );
    const actionAllowAssetContractAddress = generateContractPrincipal(
      ContractActionType.DAO_ACTION_ALLOW_ASSET
    );
    const actionSendMessageContractAddress = generateContractPrincipal(
      ContractActionType.DAO_ACTION_SEND_MESSAGE
    );
    const actionSetAccountHolderContractAddress = generateContractPrincipal(
      ContractActionType.DAO_ACTION_SET_ACCOUNT_HOLDER
    );
    const actionSetWithdrawalAmountContractAddress = generateContractPrincipal(
      ContractActionType.DAO_ACTION_SET_WITHDRAWAL_AMOUNT
    );
    const actionSetWithdrawalPeriodContractAddress = generateContractPrincipal(
      ContractActionType.DAO_ACTION_SET_WITHDRAWAL_PERIOD
    );
    const actionToggleResourceContractAddress = generateContractPrincipal(
      ContractActionType.DAO_ACTION_TOGGLE_RESOURCE
    );

    // construct bootstrap proposal contract address
    const bootstrapContractAddress = generateContractPrincipal(
      ContractProposalType.DAO_BASE_BOOTSTRAP_INITIALIZATION_V2
    );

    // generate extension contract code
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
      baseDaoContractAddress,
      tokenContractAddress,
      tokenDexContractAddress,
      tokenPoolContractAddress,
      treasuryContractAddress
    );
    const actionProposalsContract = this.generateActionProposalsContract(
      baseDaoContractAddress,
      tokenContractAddress,
      tokenDexContractAddress,
      tokenPoolContractAddress,
      treasuryContractAddress
    );
    const tokenOwnerContract = this.generateTokenOwnerContract(
      baseDaoContractAddress,
      tokenContractAddress
    );

    // generate action extension contract code
    const actionAddResourceContract = this.generateActionAddResourceContract(
      baseDaoContractAddress,
      paymentsContractAddress
    );
    const actionAllowAssetContract = this.generateActionAllowAssetContract(
      baseDaoContractAddress,
      treasuryContractAddress
    );
    const actionSendMessageContract = this.generateActionSendMessageContract(
      baseDaoContractAddress,
      messagingContractAddress
    );
    const actionSetAccountHolderContract =
      this.generateActionSetAccountHolderContract(
        baseDaoContractAddress,
        bankAccountContractAddress
      );
    const actionSetWithdrawalAmountContract =
      this.generateActionSetWithdrawalAmountContract(
        baseDaoContractAddress,
        bankAccountContractAddress
      );
    const actionSetWithdrawalPeriodContract =
      this.generateActionSetWithdrawalPeriodContract(
        baseDaoContractAddress,
        bankAccountContractAddress
      );
    const actionToggleResourceContract =
      this.generateActionToggleResourceContract(
        baseDaoContractAddress,
        paymentsContractAddress
      );

    // pass all generated extensions and action extensions for initialization
    const bootstrapContract = this.generateProposalsBootstrapContract(
      daoManifest,
      tokenContractAddress,
      baseDaoContractAddress,
      actionProposalsContractAddress,
      bankAccountContractAddress,
      coreProposalsContractAddress,
      messagingContractAddress,
      paymentsContractAddress,
      tokenOwnerContractAddress,
      treasuryContractAddress,
      actionAddResourceContractAddress,
      actionAllowAssetContractAddress,
      actionSendMessageContractAddress,
      actionSetAccountHolderContractAddress,
      actionSetWithdrawalAmountContractAddress,
      actionSetWithdrawalPeriodContractAddress,
      actionToggleResourceContractAddress
    );

    return {
      // base dao
      "base-dao": {
        source: baseContract,
        name: contractNames[ContractType.DAO_BASE],
        type: ContractType.DAO_BASE,
        address: baseDaoContractAddress,
      },
      // extensions
      "action-proposals": {
        source: actionProposalsContract,
        name: contractNames[ContractType.DAO_ACTION_PROPOSALS_V2],
        type: ContractType.DAO_ACTION_PROPOSALS_V2,
        address: actionProposalsContractAddress,
      },
      "bank-account": {
        source: bankAccountContract,
        name: contractNames[ContractType.DAO_BANK_ACCOUNT],
        type: ContractType.DAO_BANK_ACCOUNT,
        address: bankAccountContractAddress,
      },
      "core-proposals": {
        source: coreProposalsContract,
        name: contractNames[ContractType.DAO_CORE_PROPOSALS_V2],
        type: ContractType.DAO_CORE_PROPOSALS_V2,
        address: coreProposalsContractAddress,
      },
      "dao-charter": {
        source: "TBD",
        name: contractNames[ContractType.DAO_CHARTER],
        type: ContractType.DAO_CHARTER,
        address: "TBD",
      },
      "onchain-messaging": {
        source: messagingContract,
        name: contractNames[ContractType.DAO_MESSAGING],
        type: ContractType.DAO_MESSAGING,
        address: messagingContractAddress,
      },
      "payments-invoices": {
        source: paymentsInvoicesContract,
        name: contractNames[ContractType.DAO_PAYMENTS],
        type: ContractType.DAO_PAYMENTS,
        address: paymentsContractAddress,
      },
      "token-owner": {
        source: tokenOwnerContract,
        name: contractNames[ContractType.DAO_TOKEN_OWNER],
        type: ContractType.DAO_TOKEN_OWNER,
        address: tokenOwnerContractAddress,
      },
      treasury: {
        source: treasuryContract,
        name: contractNames[ContractType.DAO_TREASURY],
        type: ContractType.DAO_TREASURY,
        address: treasuryContractAddress,
      },
      // action extensions
      "action-add-resource": {
        source: actionAddResourceContract,
        name: contractNames[ContractActionType.DAO_ACTION_ADD_RESOURCE],
        type: ContractActionType.DAO_ACTION_ADD_RESOURCE,
        address: actionAddResourceContractAddress,
      },
      "action-allow-asset": {
        source: actionAllowAssetContract,
        name: contractNames[ContractActionType.DAO_ACTION_ALLOW_ASSET],
        type: ContractActionType.DAO_ACTION_ALLOW_ASSET,
        address: actionAllowAssetContractAddress,
      },
      "action-send-message": {
        source: actionSendMessageContract,
        name: contractNames[ContractActionType.DAO_ACTION_SEND_MESSAGE],
        type: ContractActionType.DAO_ACTION_SEND_MESSAGE,
        address: actionSendMessageContractAddress,
      },
      "action-set-account-holder": {
        source: actionSetAccountHolderContract,
        name: contractNames[ContractActionType.DAO_ACTION_SET_ACCOUNT_HOLDER],
        type: ContractActionType.DAO_ACTION_SET_ACCOUNT_HOLDER,
        address: actionSetAccountHolderContractAddress,
      },
      "action-set-withdrawal-amount": {
        source: actionSetWithdrawalAmountContract,
        name: contractNames[
          ContractActionType.DAO_ACTION_SET_WITHDRAWAL_AMOUNT
        ],
        type: ContractActionType.DAO_ACTION_SET_WITHDRAWAL_AMOUNT,
        address: actionSetWithdrawalAmountContractAddress,
      },
      "action-set-withdrawal-period": {
        source: actionSetWithdrawalPeriodContract,
        name: contractNames[
          ContractActionType.DAO_ACTION_SET_WITHDRAWAL_PERIOD
        ],
        type: ContractActionType.DAO_ACTION_SET_WITHDRAWAL_PERIOD,
        address: actionSetWithdrawalPeriodContractAddress,
      },
      "action-toggle-resource": {
        source: actionToggleResourceContract,
        name: contractNames[ContractActionType.DAO_ACTION_TOGGLE_RESOURCE],
        type: ContractActionType.DAO_ACTION_TOGGLE_RESOURCE,
        address: actionToggleResourceContractAddress,
      },
      // proposals
      "base-bootstrap-initialization": {
        source: bootstrapContract,
        name: contractNames[
          ContractProposalType.DAO_BASE_BOOTSTRAP_INITIALIZATION_V2
        ],
        type: ContractProposalType.DAO_BASE_BOOTSTRAP_INITIALIZATION_V2,
        address: bootstrapContractAddress,
      },
    };
  }

  // helper function to generate trait contracts
  // generated at runtime based on script parameters
  generateTraitContract(traitType: TraitType): string {
    const data = {
      // TODO: sip10_faktory_trait: getTraitReference(this.network, "SIP10_FAKTORY"),
      sip10_trait: getTraitReference(this.network, "SIP10"),
      sip09_trait: getTraitReference(this.network, "SIP09"),
      creator: this.senderAddress,
    };

    return this.eta.render(`traits/${traitType}.clar`, data);
  }
}
