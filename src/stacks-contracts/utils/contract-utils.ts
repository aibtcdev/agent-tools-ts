export const CONTRACT_DEPLOY_FEE = 500_000; // 0.5 STX

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
