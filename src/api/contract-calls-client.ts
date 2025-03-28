import { ClarityValue } from "@stacks/transactions";
import { StacksNetworkName } from "@stacks/network";

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
      cacheControl: options.cacheControl || {},
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const result = (await response.json()) as {
      success: boolean;
      data?: T;
      error?: {
        code: string;
        message: string;
        details?: any;
        id?: string;
      };
    };

    if (result.success && result.data !== undefined) {
      return result.data;
    } else {
      throw new ContractCallError(
        result.error?.code || "UNKNOWN_ERROR",
        result.error?.message || "Unknown error occurred",
        result.error?.details,
        result.error?.id
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
      throw new Error(
        `Invalid contract ID: ${contractId}. Expected format: address.name`
      );
    }

    return this.callReadOnlyFunction<T>(
      contractAddress,
      contractName,
      functionName,
      functionArgs,
      options
    );
  }

  /**
   * Fetch the ABI for a smart contract
   *
   * @param contractAddress - The contract address
   * @param contractName - The contract name
   * @param options - Additional options including cache control
   * @returns The contract ABI
   */
  async getContractAbi<T = any>(
    contractAddress: string,
    contractName: string,
    options: {
      cacheControl?: CacheControlOptions;
    } = {}
  ): Promise<T> {
    const url = `${this.baseUrl}/contract-calls/abi/${contractAddress}/${contractName}`;

    const queryParams = new URLSearchParams();

    // Add cache control options to query parameters if provided
    const cacheControl = options.cacheControl || {};
    if (cacheControl.bustCache) {
      queryParams.append("bustCache", "true");
    }
    if (cacheControl.skipCache) {
      queryParams.append("skipCache", "true");
    }
    if (cacheControl.ttl !== undefined) {
      queryParams.append("ttl", cacheControl.ttl.toString());
    }

    // Add network to query parameters
    queryParams.append("network", this.network);

    // Append query parameters to URL if any exist
    const queryString = queryParams.toString();
    const requestUrl = queryString ? `${url}?${queryString}` : url;

    const response = await fetch(requestUrl);

    const result = (await response.json()) as {
      success: boolean;
      data?: T;
      error?: {
        code: string;
        message: string;
        details?: any;
        id?: string;
      };
    };

    if (result.success && result.data !== undefined) {
      return result.data;
    } else {
      throw new ContractCallError(
        result.error?.code || "UNKNOWN_ERROR",
        result.error?.message || "Unknown error occurred",
        result.error?.details,
        result.error?.id
      );
    }
  }

  /**
   * Fetch the ABI for a contract using a fully qualified contract ID
   *
   * @param contractId - The fully qualified contract ID (address.name)
   * @param options - Additional options including cache control
   * @returns The contract ABI
   */
  async getAbi<T = any>(
    contractId: string,
    options: {
      cacheControl?: CacheControlOptions;
    } = {}
  ): Promise<T> {
    const [contractAddress, contractName] = contractId.split(".");

    if (!contractAddress || !contractName) {
      throw new Error(
        `Invalid contract ID: ${contractId}. Expected format: address.name`
      );
    }

    return this.getContractAbi<T>(contractAddress, contractName, options);
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
