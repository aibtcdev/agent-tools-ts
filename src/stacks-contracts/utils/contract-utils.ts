import { ContractType, ContractNames } from "../types/dao-types";

export function generateContractNames(tokenSymbol: string): ContractNames {
  return {
    [ContractType.TOKEN]: `${tokenSymbol.toLowerCase()}-aibtcdev`,
    [ContractType.POOL]: `xyz-pool-stx-${tokenSymbol.toLowerCase()}-v-1-1`,
    [ContractType.DEX]: `${tokenSymbol.toLowerCase()}-aibtcdev-dex`,
    [ContractType.DAO_BASE]: `${tokenSymbol.toLowerCase()}-base-dao`,
    [ContractType.DAO_ACTIONS]: `${tokenSymbol.toLowerCase()}-ext001-actions`,
    [ContractType.DAO_BANK_ACCOUNT]: `${tokenSymbol.toLowerCase()}-ext002-bank-account`,
    [ContractType.DAO_DIRECT_EXECUTE]: `${tokenSymbol.toLowerCase()}-ext003-direct-execute`,
    [ContractType.DAO_MESSAGING]: `${tokenSymbol.toLowerCase()}-ext004-messaging`,
    [ContractType.DAO_PAYMENTS]: `${tokenSymbol.toLowerCase()}-ext005-payments`,
    [ContractType.DAO_TREASURY]: `${tokenSymbol.toLowerCase()}-ext006-treasury`,
    [ContractType.DAO_PROPOSAL_BOOTSTRAP]: `${tokenSymbol.toLowerCase()}-prop001-bootstrap`,
  };
}
