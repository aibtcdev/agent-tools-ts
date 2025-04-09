import { BaseCoreProposalRegistryEntry } from "../dao-core-proposal-registry";

// Timed Vault Proposals
export const COREPROPOSALS_TIMED_VAULT: BaseCoreProposalRegistryEntry[] = [
  {
    name: "aibtc-timed-vault-dao-initialize-new-account",
    friendlyName: "Timed Vault (DAO): Initialize New Account",
    templatePath: "proposals/aibtc-timed-vault-dao-initialize-new-account.clar",
    requiredRuntimeValues: [
      { key: "account_holder" },
      { key: "amount_to_fund_stx" },
      { key: "amount_to_fund_ft" },
    ],
    requiredTraits: [{ ref: "DAO_PROPOSAL", key: "dao_proposal_trait" }],
    requiredContractAddresses: [
      {
        key: "message_contract",
        category: "EXTENSIONS",
        subcategory: "MESSAGING",
      },
      {
        key: "timed_vault_contract",
        category: "EXTENSIONS",
        subcategory: "TIMED_VAULT_DAO",
      },
      {
        key: "base_dao_contract",
        category: "BASE",
        subcategory: "DAO",
      },
      {
        key: "treasury_contract",
        category: "EXTENSIONS",
        subcategory: "TREASURY",
      },
      {
        key: "token_contract",
        category: "TOKEN",
        subcategory: "DAO",
      },
    ],
  },
  {
    name: "aibtc-timed-vault-dao-override-last-withdrawal-block",
    friendlyName: "Timed Vault (DAO): Override Last Withdrawal Block",
    templatePath:
      "proposals/aibtc-timed-vault-dao-override-last-withdrawal-block.clar",
    requiredRuntimeValues: [{ key: "last_withdrawal_block" }],
    requiredTraits: [{ ref: "DAO_PROPOSAL", key: "dao_proposal_trait" }],
    requiredContractAddresses: [
      {
        key: "message_contract",
        category: "EXTENSIONS",
        subcategory: "MESSAGING",
      },
      {
        key: "timed_vault_contract",
        category: "EXTENSIONS",
        subcategory: "TIMED_VAULT_DAO",
      },
    ],
  },
  {
    name: "aibtc-timed-vault-dao-set-account-holder",
    friendlyName: "Timed Vault (DAO): Set Account Holder",
    templatePath: "proposals/aibtc-timed-dao-vault-set-account-holder.clar",
    requiredRuntimeValues: [{ key: "account_holder" }],
    requiredTraits: [{ ref: "DAO_PROPOSAL", key: "dao_proposal_trait" }],
    requiredContractAddresses: [
      {
        key: "message_contract",
        category: "EXTENSIONS",
        subcategory: "MESSAGING",
      },
      {
        key: "timed_vault_contract",
        category: "EXTENSIONS",
        subcategory: "TIMED_VAULT_DAO",
      },
    ],
  },
  {
    name: "aibtc-timed-vault-dao-set-withdrawal-amount",
    friendlyName: "Timed Vault (DAO): Set Withdrawal Amount",
    templatePath: "proposals/aibtc-timed-vault-dao-set-withdrawal-amount.clar",
    requiredRuntimeValues: [{ key: "withdrawal_amount" }],
    requiredTraits: [{ ref: "DAO_PROPOSAL", key: "dao_proposal_trait" }],
    requiredContractAddresses: [
      {
        key: "message_contract",
        category: "EXTENSIONS",
        subcategory: "MESSAGING",
      },
      {
        key: "timed_vault_contract",
        category: "EXTENSIONS",
        subcategory: "TIMED_VAULT_DAO",
      },
    ],
  },
  {
    name: "aibtc-timed-vault-dao-set-withdrawal-period",
    friendlyName: "Timed Vault (DAO): Set Withdrawal Period",
    templatePath: "proposals/aibtc-timed-vault-dao-set-withdrawal-period.clar",
    requiredRuntimeValues: [{ key: "withdrawal_period" }],
    requiredTraits: [{ ref: "DAO_PROPOSAL", key: "dao_proposal_trait" }],
    requiredContractAddresses: [
      {
        key: "message_contract",
        category: "EXTENSIONS",
        subcategory: "MESSAGING",
      },
      {
        key: "timed_vault_contract",
        category: "EXTENSIONS",
        subcategory: "TIMED_VAULT_DAO",
      },
    ],
  },
  {
    name: "aibtc-timed-vault-dao-withdraw",
    friendlyName: "Timed Vault (DAO): Withdraw",
    templatePath: "proposals/aibtc-timed-vault-dao-withdraw.clar",
    requiredTraits: [{ ref: "DAO_PROPOSAL", key: "dao_proposal_trait" }],
    requiredContractAddresses: [
      {
        key: "message_contract",
        category: "EXTENSIONS",
        subcategory: "MESSAGING",
      },
      {
        key: "timed_vault_contract",
        category: "EXTENSIONS",
        subcategory: "TIMED_VAULT_DAO",
      },
    ],
  },
  {
    name: "aibtc-timed-vault-sbtc-initialize-new-account",
    friendlyName: "Timed Vault (SBTC): Initialize New Account",
    templatePath:
      "proposals/aibtc-timed-vault-sbtc-initialize-new-account.clar",
    requiredRuntimeValues: [
      { key: "account_holder" },
      { key: "amount_to_fund_stx" },
      { key: "amount_to_fund_ft" },
    ],
    requiredTraits: [{ ref: "DAO_PROPOSAL", key: "dao_proposal_trait" }],
    requiredContractAddresses: [
      {
        key: "message_contract",
        category: "EXTENSIONS",
        subcategory: "MESSAGING",
      },
      {
        key: "timed_vault_contract",
        category: "EXTENSIONS",
        subcategory: "TIMED_VAULT_SBTC",
      },
      {
        key: "base_dao_contract",
        category: "BASE",
        subcategory: "DAO",
      },
      {
        key: "treasury_contract",
        category: "EXTENSIONS",
        subcategory: "TREASURY",
      },
      {
        key: "token_contract",
        category: "TOKEN",
        subcategory: "DAO",
      },
    ],
  },
  {
    name: "aibtc-timed-vault-sbtc-override-last-withdrawal-block",
    friendlyName: "Timed Vault (SBTC): Override Last Withdrawal Block",
    templatePath:
      "proposals/aibtc-timed-vault-sbtc-override-last-withdrawal-block.clar",
    requiredRuntimeValues: [{ key: "last_withdrawal_block" }],
    requiredTraits: [{ ref: "DAO_PROPOSAL", key: "dao_proposal_trait" }],
    requiredContractAddresses: [
      {
        key: "message_contract",
        category: "EXTENSIONS",
        subcategory: "MESSAGING",
      },
      {
        key: "timed_vault_contract",
        category: "EXTENSIONS",
        subcategory: "TIMED_VAULT_SBTC",
      },
    ],
  },
  {
    name: "aibtc-timed-vault-sbtc-set-account-holder",
    friendlyName: "Timed Vault (SBTC): Set Account Holder",
    templatePath: "proposals/aibtc-timed-vault-sbtc-set-account-holder.clar",
    requiredRuntimeValues: [{ key: "account_holder" }],
    requiredTraits: [{ ref: "DAO_PROPOSAL", key: "dao_proposal_trait" }],
    requiredContractAddresses: [
      {
        key: "message_contract",
        category: "EXTENSIONS",
        subcategory: "MESSAGING",
      },
      {
        key: "timed_vault_contract",
        category: "EXTENSIONS",
        subcategory: "TIMED_VAULT_SBTC",
      },
    ],
  },
  {
    name: "aibtc-timed-vault-sbtc-set-withdrawal-amount",
    friendlyName: "Timed Vault (SBTC): Set Withdrawal Amount",
    templatePath: "proposals/aibtc-timed-vault-sbtc-set-withdrawal-amount.clar",
    requiredRuntimeValues: [{ key: "withdrawal_amount" }],
    requiredTraits: [{ ref: "DAO_PROPOSAL", key: "dao_proposal_trait" }],
    requiredContractAddresses: [
      {
        key: "message_contract",
        category: "EXTENSIONS",
        subcategory: "MESSAGING",
      },
      {
        key: "timed_vault_contract",
        category: "EXTENSIONS",
        subcategory: "TIMED_VAULT_SBTC",
      },
    ],
  },
  {
    name: "aibtc-timed-vault-sbtc-set-withdrawal-period",
    friendlyName: "Timed Vault (SBTC): Set Withdrawal Period",
    templatePath: "proposals/aibtc-timed-vault-sbtc-set-withdrawal-period.clar",
    requiredRuntimeValues: [{ key: "withdrawal_period" }],
    requiredTraits: [{ ref: "DAO_PROPOSAL", key: "dao_proposal_trait" }],
    requiredContractAddresses: [
      {
        key: "message_contract",
        category: "EXTENSIONS",
        subcategory: "MESSAGING",
      },
      {
        key: "timed_vault_contract",
        category: "EXTENSIONS",
        subcategory: "TIMED_VAULT_SBTC",
      },
    ],
  },
  {
    name: "aibtc-timed-vault-sbtc-withdraw",
    friendlyName: "Timed Vault (SBTC): Withdraw",
    templatePath: "proposals/aibtc-timed-vault-sbtc-withdraw.clar",
    requiredTraits: [{ ref: "DAO_PROPOSAL", key: "dao_proposal_trait" }],
    requiredContractAddresses: [
      {
        key: "message_contract",
        category: "EXTENSIONS",
        subcategory: "MESSAGING",
      },
      {
        key: "timed_vault_contract",
        category: "EXTENSIONS",
        subcategory: "TIMED_VAULT_SBTC",
      },
    ],
  },
  {
    name: " aibtc-timed-vault-stx-initialize-new-account",
    friendlyName: "Timed Vault (STX): Initialize New Account",
    templatePath: "proposals/aibtc-timed-vault-stx-initialize-new-account.clar",
    requiredRuntimeValues: [
      { key: "account_holder" },
      { key: "amount_to_fund_stx" },
      { key: "amount_to_fund_ft" },
    ],
    requiredTraits: [{ ref: "DAO_PROPOSAL", key: "dao_proposal_trait" }],
    requiredContractAddresses: [
      {
        key: "message_contract",
        category: "EXTENSIONS",
        subcategory: "MESSAGING",
      },
      {
        key: "timed_vault_contract",
        category: "EXTENSIONS",
        subcategory: "TIMED_VAULT_STX",
      },
      {
        key: "base_dao_contract",
        category: "BASE",
        subcategory: "DAO",
      },
      {
        key: "treasury_contract",
        category: "EXTENSIONS",
        subcategory: "TREASURY",
      },
      {
        key: "token_contract",
        category: "TOKEN",
        subcategory: "DAO",
      },
    ],
  },
  {
    name: "aibtc-timed-vault-stx-override-last-withdrawal-block",
    friendlyName: "Timed Vault (STX): Override Last Withdrawal Block",
    templatePath:
      "proposals/aibtc-timed-vault-stx-override-last-withdrawal-block.clar",
    requiredRuntimeValues: [{ key: "last_withdrawal_block" }],
    requiredTraits: [{ ref: "DAO_PROPOSAL", key: "dao_proposal_trait" }],
    requiredContractAddresses: [
      {
        key: "message_contract",
        category: "EXTENSIONS",
        subcategory: "MESSAGING",
      },
      {
        key: "timed_vault_contract",
        category: "EXTENSIONS",
        subcategory: "TIMED_VAULT_STX",
      },
    ],
  },
  {
    name: "aibtc-timed-vault-stx-set-account-holder",
    friendlyName: "Timed Vault (STX): Set Account Holder",
    templatePath: "proposals/aibtc-timed-vault-stx-set-account-holder.clar",
    requiredRuntimeValues: [{ key: "account_holder" }],
    requiredTraits: [{ ref: "DAO_PROPOSAL", key: "dao_proposal_trait" }],
    requiredContractAddresses: [
      {
        key: "message_contract",
        category: "EXTENSIONS",
        subcategory: "MESSAGING",
      },
      {
        key: "timed_vault_contract",
        category: "EXTENSIONS",
        subcategory: "TIMED_VAULT_STX",
      },
    ],
  },
  {
    name: "aibtc-timed-vault-stx-set-withdrawal-amount",
    friendlyName: "Timed Vault (STX): Set Withdrawal Amount",
    templatePath: "proposals/aibtc-timed-vault-stx-set-withdrawal-amount.clar",
    requiredRuntimeValues: [{ key: "withdrawal_amount" }],
    requiredTraits: [{ ref: "DAO_PROPOSAL", key: "dao_proposal_trait" }],
    requiredContractAddresses: [
      {
        key: "message_contract",
        category: "EXTENSIONS",
        subcategory: "MESSAGING",
      },
      {
        key: "timed_vault_contract",
        category: "EXTENSIONS",
        subcategory: "TIMED_VAULT_STX",
      },
    ],
  },
  {
    name: "aibtc-timed-vault-stx-set-withdrawal-period",
    friendlyName: "Timed Vault (STX): Set Withdrawal Period",
    templatePath: "proposals/aibtc-timed-vault-stx-set-withdrawal-period.clar",
    requiredRuntimeValues: [{ key: "withdrawal_period" }],
    requiredTraits: [{ ref: "DAO_PROPOSAL", key: "dao_proposal_trait" }],
    requiredContractAddresses: [
      {
        key: "message_contract",
        category: "EXTENSIONS",
        subcategory: "MESSAGING",
      },
      {
        key: "timed_vault_contract",
        category: "EXTENSIONS",
        subcategory: "TIMED_VAULT_STX",
      },
    ],
  },
  {
    name: " aibtc-timed-vault-stx-withdraw",
    friendlyName: " Timed Vault (STX): Withdraw",
    templatePath: " proposals/aibtc-timed-vault-stx-withdraw.clar",
    requiredTraits: [{ ref: "DAO_PROPOSAL", key: "dao_proposal_trait" }],
    requiredContractAddresses: [
      {
        key: "message_contract",
        category: "EXTENSIONS",
        subcategory: "MESSAGING",
      },
      {
        key: "timed_vault_contract",
        category: "EXTENSIONS",
        subcategory: "TIMED_VAULT_STX",
      },
    ],
  },
];
