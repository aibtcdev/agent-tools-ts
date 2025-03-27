import { ClarityValue, StacksNetworkName } from "@stacks/transactions";
import { ContractCallsClient, CacheControlOptions } from "./api/contract-calls-client";
import { TokenInfoService, TokenInfo } from "./api/token-info-service";

/**
 * Call a read-only function on a smart contract
 * 
 * @param contractId - The fully qualified contract ID (address.name)
 * @param functionName - The function to call
 * @param functionArgs - Arguments to pass to the function
 * @param network - The Stacks network to use
 * @param cacheOptions - Options for controlling cache behavior
 * @returns The function result
 */
export async function callReadOnlyFunction<T = any>(
  contractId: string,
  functionName: string,
  functionArgs: ClarityValue[],
  network?: StacksNetworkName,
  cacheOptions?: CacheControlOptions
): Promise<T> {
  const client = new ContractCallsClient(network);
  return client.callContractFunction<T>(contractId, functionName, functionArgs, {
    cacheControl: cacheOptions
  });
}

/**
 * Get information about a SIP-010 fungible token
 * 
 * @param tokenContract - The fully qualified contract ID of the token
 * @param bustCache - Whether to bypass the cache
 * @returns Information about the token
 */
export async function getSIP010Info(
  tokenContract: string,
  bustCache: boolean = false
): Promise<TokenInfo> {
  const tokenService = new TokenInfoService();
  return tokenService.getSIP010TokenInfo(tokenContract, bustCache);
}

// Re-export types for convenience
export { TokenInfo, CacheControlOptions };
