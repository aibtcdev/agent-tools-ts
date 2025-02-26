export const stakingDaoContractAddress =
  "SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG";
export const stakingDaoContractNames = {
  baseContract: `stacking-dao-core-v2`,
  reserveContract: `reserve-v1`,
  commissionContract: `commission-v1`,
  stakingContract: `staking-v0`,
  directHelpers: `direct-helpers-v1`,
};
/**
 * returns joining address and name
 */
export function getStakingDaoContractID(name: string) {
  return `${stakingDaoContractAddress}.${name}`;
}
