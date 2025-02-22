import {
  ContractType,
  ContractNames,
  ContractActionType,
  ContractProposalType,
} from "../types/dao-types";

export const CONTRACT_DEPLOY_FEE = 500_000; // 0.5 STX

export function generateContractNames(tokenSymbol: string): ContractNames {
  return {
    [ContractType.DAO_TOKEN]: `${tokenSymbol.toLowerCase()}-faktory`,
    [ContractType.DAO_BITFLOW_POOL]: `xyk-pool-stx-${tokenSymbol.toLowerCase()}-v-1-1`,
    [ContractType.DAO_TOKEN_DEX]: `${tokenSymbol.toLowerCase()}-faktory-dex`,
    [ContractType.DAO_TOKEN_OWNER]: `${tokenSymbol.toLowerCase()}-token-owner`,
    [ContractType.DAO_BASE]: `${tokenSymbol.toLowerCase()}-base-dao`,
    [ContractType.DAO_ACTION_PROPOSALS]: `${tokenSymbol.toLowerCase()}-action-proposals`,
    [ContractType.DAO_ACTION_PROPOSALS_V2]: `${tokenSymbol.toLowerCase()}-action-proposals-v2`,
    [ContractType.DAO_BANK_ACCOUNT]: `${tokenSymbol.toLowerCase()}-bank-account`,
    [ContractType.DAO_CORE_PROPOSALS]: `${tokenSymbol.toLowerCase()}-core-proposals`,
    [ContractType.DAO_CORE_PROPOSALS_V2]: `${tokenSymbol.toLowerCase()}-core-proposals-v2`,
    [ContractType.DAO_CHARTER]: `${tokenSymbol.toLowerCase()}-dao-charter`,
    [ContractType.DAO_MESSAGING]: `${tokenSymbol.toLowerCase()}-onchain-messaging`,
    [ContractType.DAO_PAYMENTS]: `${tokenSymbol.toLowerCase()}-payments-invoices`,
    [ContractType.DAO_TREASURY]: `${tokenSymbol.toLowerCase()}-treasury`,
    [ContractActionType.DAO_ACTION_ADD_RESOURCE]: `${tokenSymbol.toLowerCase()}-action-add-resource`,
    [ContractActionType.DAO_ACTION_ALLOW_ASSET]: `${tokenSymbol.toLowerCase()}-action-allow-asset`,
    [ContractActionType.DAO_ACTION_SEND_MESSAGE]: `${tokenSymbol.toLowerCase()}-action-send-message`,
    [ContractActionType.DAO_ACTION_SET_ACCOUNT_HOLDER]: `${tokenSymbol.toLowerCase()}-action-set-account-holder`,
    [ContractActionType.DAO_ACTION_SET_WITHDRAWAL_AMOUNT]: `${tokenSymbol.toLowerCase()}-action-set-withdrawal-amount`,
    [ContractActionType.DAO_ACTION_SET_WITHDRAWAL_PERIOD]: `${tokenSymbol.toLowerCase()}-action-set-withdrawal-period`,
    [ContractActionType.DAO_ACTION_TOGGLE_RESOURCE]: `${tokenSymbol.toLowerCase()}-action-toggle-resource`,
    [ContractProposalType.DAO_BASE_BOOTSTRAP_INITIALIZATION]: `${tokenSymbol.toLowerCase()}-base-bootstrap-initialization`,
    [ContractProposalType.DAO_BASE_BOOTSTRAP_INITIALIZATION_V2]: `${tokenSymbol.toLowerCase()}-base-bootstrap-initialization-v2`,
  };
}

interface Result {
  fee: number;
  buyableToken: number;
  stxBuy: number;
  newTokenBalance: number;
  stxBalance: number;
  recommendStxAmount: number;
  tokenBalance: number;
}
export const BUY_FIRST_FEE = 0.5;
export const MAX_PURCHASE_PERCENTAGE = 0.1;
// parameter value is original value, no decimals
export function calculateBondingCurveExchange(
  stxInputAmount: number,
  targetStxAmount: number,
  initialTokenSupply: number,
  decimalPlaces: number = 6
): Result {
  const DECIMAL_FACTOR = Math.pow(10, decimalPlaces);
  const FEE_PERCENTAGE = 0.02; // 2% fee
  const VIRTUAL_STX_RATIO = 0.2; // 1/5 of target STX amount

  const stxInputInMicroSTX = stxInputAmount * DECIMAL_FACTOR;
  const tokenSupplyInMicroTokens = initialTokenSupply * DECIMAL_FACTOR;
  const targetStxInMicroSTX = targetStxAmount * DECIMAL_FACTOR;

  const virtualStxBalance = targetStxInMicroSTX * VIRTUAL_STX_RATIO;
  const initialStxBalance = virtualStxBalance; // Start with virtual STX balance

  // no fee, no fee
  const stxFee = Math.floor(stxInputInMicroSTX * FEE_PERCENTAGE);
  // const stxInputAfterFee = stxInputInMicroSTX - stxFee;
  const stxInputAfterFee = stxInputInMicroSTX;

  const constantProduct = tokenSupplyInMicroTokens * initialStxBalance;
  const newStxBalance = initialStxBalance + stxInputAfterFee;
  const newTokenSupply = Math.floor(constantProduct / newStxBalance);
  const tokensToReceive = tokenSupplyInMicroTokens - newTokenSupply;

  const recommendedStxInput = targetStxAmount;
  const recommendedStxInputWithFee = Math.floor(
    recommendedStxInput / (1 - FEE_PERCENTAGE)
  );

  return {
    fee: stxFee,
    buyableToken: tokensToReceive,
    stxBuy: stxInputAfterFee,
    newTokenBalance: newTokenSupply,
    stxBalance: 0, // Initial real STX balance is 0
    recommendStxAmount: recommendedStxInputWithFee,
    tokenBalance: initialTokenSupply,
  };
}

// Add this new function
export function calculateMaxSTXForPercentage(
  targetStxAmount: number,
  tokenSupply: number,
  percentageLimit: number = MAX_PURCHASE_PERCENTAGE,
  decimalPlaces: number = 6
): number {
  const startingPercentage = 0.0025; // 0.25% of targetStxAmount
  let stxInputAmount = targetStxAmount * startingPercentage;
  const step = targetStxAmount * 0.0001; // 0.01% step for fine-tuning

  while (true) {
    // parameter value is original value, no decimals
    const result = calculateBondingCurveExchange(
      stxInputAmount,
      targetStxAmount,
      tokenSupply,
      decimalPlaces
    );
    const tokensBought = result.buyableToken / Math.pow(10, decimalPlaces);
    const percentageBought = tokensBought / tokenSupply;
    if (percentageBought > percentageLimit) {
      // We've gone too far, step back and return the previous valid amount
      return stxInputAmount - step;
    }

    if (percentageBought === percentageLimit) {
      // We've found the exact amount
      return stxInputAmount / Math.pow(10, decimalPlaces);
    }

    // Increase the input amount and continue searching
    stxInputAmount += step;
  }
}

export const applyFee = (
  amount: number,
  feePercentage: number = BUY_FIRST_FEE
): number => {
  return amount * (1 + feePercentage);
};

export const removeFee = (
  amount: number,
  feePercentage: number = BUY_FIRST_FEE
): number => {
  return amount / (1 + feePercentage);
};
