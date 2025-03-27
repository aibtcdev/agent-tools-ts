import { StacksNetworkName } from "@stacks/network";
import { ContractCallsClient } from "./contract-calls-client";
import { getNetworkByPrincipal } from "../utilities";

/**
 * Information about a SIP-010 fungible token
 */
export interface TokenInfo {
  /** The name of the token */
  name: string;
  /** The symbol of the token */
  symbol: string;
  /** The number of decimal places as a string (may include 'n' suffix for bigint) */
  decimals: string;
  /** The total supply of the token as a string (may include 'n' suffix for bigint) */
  totalSupply: string;
  /** URI for token metadata */
  tokenUri?: string;
}

/**
 * Service for retrieving information about tokens
 */
export class TokenInfoService {
  private client: ContractCallsClient;
  
  constructor(network: StacksNetworkName = "testnet") {
    this.client = new ContractCallsClient(network);
  }

  /**
   * Get information about a SIP-010 fungible token
   * 
   * @param tokenContract - The fully qualified contract ID of the token
   * @param bustCache - Whether to bypass the cache
   * @returns Information about the token
   */
  async getSIP010TokenInfo(tokenContract: string, bustCache: boolean = false): Promise<TokenInfo> {
    const [contractAddress] = tokenContract.split(".");
    const network = getNetworkByPrincipal(contractAddress);
    
    // Create a new client with the correct network if needed
    if (network !== this.client.network) {
      this.client = new ContractCallsClient(network);
    }
    
    // Get all token information in parallel
    const [name, symbol, decimals, totalSupply, tokenUri] = await Promise.all([
      this.client.callContractFunction<string>(tokenContract, "get-name", [], {
        cacheControl: { bustCache }
      }),
      this.client.callContractFunction<string>(tokenContract, "get-symbol", [], {
        cacheControl: { bustCache }
      }),
      this.client.callContractFunction<string>(tokenContract, "get-decimals", [], {
        cacheControl: { bustCache }
      }),
      this.client.callContractFunction<string>(tokenContract, "get-total-supply", [], {
        cacheControl: { bustCache } // Use the same cache setting as other calls
      }),
      this.client.callContractFunction<string>(tokenContract, "get-token-uri", [], {
        cacheControl: { bustCache }
      }).catch(() => undefined) // Token URI is optional
    ]);
    
    return {
      name,
      symbol,
      decimals,
      totalSupply,
      tokenUri
    };
  }
}
