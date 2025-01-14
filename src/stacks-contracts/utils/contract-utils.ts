import {
  ContractType,
  ContractNames,
  ContractActionType,
} from "../types/dao-types";

export function generateContractNames(tokenSymbol: string): ContractNames {
  return {
    [ContractType.DAO_TOKEN]: `${tokenSymbol.toLowerCase()}-stxcity`,
    [ContractType.DAO_BITFLOW_POOL]: `xyk-pool-stx-${tokenSymbol.toLowerCase()}-v-1-1`,
    [ContractType.DAO_TOKEN_DEX]: `${tokenSymbol.toLowerCase()}-stxcity-dex`,
    [ContractType.DAO_TOKEN_OWNER]: `${tokenSymbol.toLowerCase()}-token-owner`,
    [ContractType.DAO_BASE]: `${tokenSymbol.toLowerCase()}-base-dao`,
    [ContractType.DAO_ACTION_PROPOSALS]: `${tokenSymbol.toLowerCase()}-action-proposals`,
    [ContractType.DAO_BANK_ACCOUNT]: `${tokenSymbol.toLowerCase()}-bank-account`,
    [ContractType.DAO_CORE_PROPOSALS]: `${tokenSymbol.toLowerCase()}-core-proposals`,
    [ContractType.DAO_MESSAGING]: `${tokenSymbol.toLowerCase()}-onchain-messaging`,
    [ContractType.DAO_PAYMENTS]: `${tokenSymbol.toLowerCase()}-payments-invoices`,
    [ContractType.DAO_TREASURY]: `${tokenSymbol.toLowerCase()}-treasury`,
    [ContractType.DAO_PROPOSAL_BOOTSTRAP]: `${tokenSymbol.toLowerCase()}-base-bootstrap-initialization`,
    [ContractActionType.DAO_ACTION_ADD_RESOURCE]: `${tokenSymbol.toLowerCase()}-action-add-resource`,
    [ContractActionType.DAO_ACTION_ALLOW_ASSET]: `${tokenSymbol.toLowerCase()}-action-allow-asset`,
    [ContractActionType.DAO_ACTION_SEND_MESSAGE]: `${tokenSymbol.toLowerCase()}-action-send-message`,
    [ContractActionType.DAO_ACTION_SET_ACCOUNT_HOLDER]: `${tokenSymbol.toLowerCase()}-action-set-account-holder`,
    [ContractActionType.DAO_ACTION_SET_WITHDRAWAL_AMOUNT]: `${tokenSymbol.toLowerCase()}-action-set-withdrawal-amount`,
    [ContractActionType.DAO_ACTION_SET_WITHDRAWAL_PERIOD]: `${tokenSymbol.toLowerCase()}-action-set-withdrawal-period`,
    [ContractActionType.DAO_ACTION_TOGGLE_RESOURCE]: `${tokenSymbol.toLowerCase()}-action-toggle-resource`,
  };
}
