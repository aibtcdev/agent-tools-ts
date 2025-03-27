import { ClarityValue, StacksNetworkName } from "@stacks/transactions";

/**
 * Options for controlling cache behavior
 */
export interface CacheControlOptions {
  /** If true, bypass the cache and force a fresh request */
  bustCache?: boolean;
  /** If true, don't cache the result of this request */
  skipCache?: boolean;
  /** Custom TTL in seconds for this specific request */
  ttl?: number;
}

/**
 * Client for interacting with the AIBTC Contract Calls API
 */
export class ContractCallsClient {
  private baseUrl: string;
  network: StacksNetworkName;

  constructor(network: StacksNetworkName = "testnet") {
    this.network = network;
    this.baseUrl = this.getBaseUrl(network);
  }

  /**
   * Get the base URL for the specified network
   */
  private getBaseUrl(network: StacksNetworkName): string {
    switch (network) {
      case "mainnet":
        return "https://cache.aibtc.dev";
      case "testnet":
        return "https://cache-staging.aibtc.dev";
      default:
        throw new Error(`Unsupported network: ${network}`);
    }
  }

  /**
   * Call a read-only function on a smart contract
   * 
   * @param contractAddress - The contract address
   * @param contractName - The contract name
   * @param functionName - The function to call
   * @param functionArgs - Arguments to pass to the function
   * @param options - Additional options including cache control
   * @returns The function result
   */
  async callReadOnlyFunction<T = any>(
    contractAddress: string,
    contractName: string,
    functionName: string,
    functionArgs: ClarityValue[],
    options: {
      senderAddress?: string;
      cacheControl?: CacheControlOptions;
    } = {}
  ): Promise<T> {
    const url = `${this.baseUrl}/contract-calls/read-only/${contractAddress}/${contractName}/${functionName}`;
    
    const body = {
      functionArgs,
      network: this.network,
      senderAddress: options.senderAddress,
      cacheControl: options.cacheControl || {}
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const result = await response.json();
    
    if (result.success) {
      return result.data as T;
    } else {
      throw new ContractCallError(
        result.error.code,
        result.error.message,
        result.error.details,
        result.error.id
      );
    }
  }

  /**
   * Call a read-only function using a fully qualified contract ID
   * 
   * @param contractId - The fully qualified contract ID (address.name)
   * @param functionName - The function to call
   * @param functionArgs - Arguments to pass to the function
   * @param options - Additional options including cache control
   * @returns The function result
   */
  async callContractFunction<T = any>(
    contractId: string,
    functionName: string,
    functionArgs: ClarityValue[],
    options: {
      senderAddress?: string;
      cacheControl?: CacheControlOptions;
    } = {}
  ): Promise<T> {
    const [contractAddress, contractName] = contractId.split(".");
    
    if (!contractAddress || !contractName) {
      throw new Error(`Invalid contract ID: ${contractId}. Expected format: address.name`);
    }
    
    return this.callReadOnlyFunction<T>(
      contractAddress,
      contractName,
      functionName,
      functionArgs,
      options
    );
  }
}

/**
 * Error thrown when a contract call fails
 */
export class ContractCallError extends Error {
  code: string;
  details?: any;
  id?: string;

  constructor(code: string, message: string, details?: any, id?: string) {
    super(message);
    this.name = "ContractCallError";
    this.code = code;
    this.details = details;
    this.id = id;
  }
}
