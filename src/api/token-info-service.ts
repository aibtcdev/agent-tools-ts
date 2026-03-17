import { StacksNetworkName } from "@stacks/network";
import { ContractCallsClient, CacheControlOptions, ContractCallError } from "./contract-calls-client";
import { getNetworkByPrincipal } from "../utilities";

/**
 * Error thrown when token metadata cannot be retrieved
 */
export class TokenMetadataError extends Error {
  constructor(
    public readonly contractId: string,
    public readonly reason: string,
    public readonly cause?: Error
  ) {
    super(`Failed to get token metadata for ${contractId}: ${reason}`);
    this.name = "TokenMetadataError";
  }
}

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
  /** Description of the token */
  description?: string;
  /** Image URI for the token */
  imageUri?: string;
  /** Thumbnail image URI for the token */
  imageThumbnailUri?: string;
  /** Canonical image URI for the token */
  imageCanonicalUri?: string;
}

/**
 * Response from the Hiro Token Metadata API
 */
export interface HiroTokenMetadataResponse {
  name: string;
  symbol: string;
  decimals: number;
  total_supply: string;
  token_uri?: string;
  description?: string;
  image_uri?: string;
  image_thumbnail_uri?: string;
  image_canonical_uri?: string;
  tx_id: string;
  sender_address: string;
  asset_identifier: string;
  metadata?: {
    sip?: number;
    name?: string;
    description?: string;
    image?: string;
    cached_image?: string;
    cached_thumbnail_image?: string;
    properties?: Record<string, unknown>;
  };
}

/**
 * Contract ABI structure for fungible tokens
 */
export interface ContractAbi {
  functions: any[];
  variables: any[];
  maps: any[];
  fungible_tokens: Array<{ name: string }>;
  non_fungible_tokens: any[];
  epoch?: string;
  clarity_version?: string;
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
   * Fetch token metadata from the cache
   *
   * @param tokenContract - The fully qualified contract ID of the token
   * @param options - Cache control options
   * @returns Token metadata from cache, or undefined if not available
   */
  async getTokenMetadataFromCache(
    tokenContract: string,
    options: { cacheControl?: CacheControlOptions } = {}
  ): Promise<HiroTokenMetadataResponse | undefined> {
    try {
      const metadata = await this.client.getTokenMetadata<HiroTokenMetadataResponse>(
        tokenContract,
        options
      );
      return metadata;
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Get the asset name from a contract ABI
   *
   * @param contractId - The fully qualified contract ID
   * @param bustCache - Whether to bypass the cache
   * @returns The asset name from the contract ABI
   */
  async getAssetNameFromAbi(
    contractId: string,
    bustCache: boolean = false
  ): Promise<string | undefined> {
    const [contractAddress, contractName] = contractId.split(".");
    const network = getNetworkByPrincipal(contractAddress);

    // Create a new client with the correct network if needed
    if (network !== this.client.network) {
      this.client = new ContractCallsClient(network);
    }

    // Get the contract ABI
    const abi = await this.client.getAbi<ContractAbi>(contractId, {
      cacheControl: { bustCache },
    });

    // Extract the fungible token name from the ABI
    if (abi.fungible_tokens && abi.fungible_tokens.length > 0) {
      return abi.fungible_tokens[0].name;
    }

    return undefined;
  }

  /**
   * Get information about a SIP-010 fungible token
   * First tries the cached token metadata, falls back to contract calls if unavailable
   *
   * @param tokenContract - The fully qualified contract ID of the token
   * @param options - Cache control options
   * @returns Information about the token
   */
  async getSIP010TokenInfo(
    tokenContract: string,
    options: { cacheControl?: CacheControlOptions } = {}
  ): Promise<TokenInfo> {
    // Try to get token metadata from cache first
    const metadata = await this.getTokenMetadataFromCache(tokenContract, options);

    if (metadata) {
      return {
        name: metadata.name,
        symbol: metadata.symbol,
        decimals: metadata.decimals.toString(),
        totalSupply: metadata.total_supply,
        tokenUri: metadata.token_uri,
        description: metadata.description,
        imageUri: metadata.image_uri,
        imageThumbnailUri: metadata.image_thumbnail_uri,
        imageCanonicalUri: metadata.image_canonical_uri,
      };
    }

    // Fall back to contract calls if cache is unavailable
    const [contractAddress] = tokenContract.split(".");
    const network = getNetworkByPrincipal(contractAddress);

    // Create a new client with the correct network if needed
    if (network !== this.client.network) {
      this.client = new ContractCallsClient(network);
    }

    // Get all token information in parallel
    const [name, symbol, decimals, totalSupply, tokenUri] = await Promise.all([
      this.client.callContractFunction<string>(tokenContract, "get-name", [], options),
      this.client.callContractFunction<string>(tokenContract, "get-symbol", [], options),
      this.client.callContractFunction<string>(tokenContract, "get-decimals", [], options),
      this.client.callContractFunction<string>(tokenContract, "get-total-supply", [], options),
      this.client
        .callContractFunction<string>(tokenContract, "get-token-uri", [], options)
        .catch(() => undefined), // Token URI is optional
    ]);

    return {
      name,
      symbol,
      decimals,
      totalSupply,
      tokenUri,
    };
  }

  /**
   * Get full token metadata from the metadata API
   * This method always attempts to fetch from the metadata cache first
   *
   * @param tokenContract - The fully qualified contract ID of the token
   * @param options - Cache control options
   * @returns Full token metadata response
   * @throws TokenMetadataError if metadata cannot be retrieved
   */
  async getTokenMetadata(
    tokenContract: string,
    options: { cacheControl?: CacheControlOptions } = {}
  ): Promise<HiroTokenMetadataResponse> {
    const metadata = await this.getTokenMetadataFromCache(tokenContract, options);

    if (!metadata) {
      throw new TokenMetadataError(
        tokenContract,
        "Token metadata not found in cache. The token may not be indexed or may not exist."
      );
    }

    return metadata;
  }

  /**
   * Check if token metadata is available in the cache
   *
   * @param tokenContract - The fully qualified contract ID of the token
   * @param options - Cache control options
   * @returns True if metadata is available, false otherwise
   */
  async hasTokenMetadata(
    tokenContract: string,
    options: { cacheControl?: CacheControlOptions } = {}
  ): Promise<boolean> {
    const metadata = await this.getTokenMetadataFromCache(tokenContract, options);
    return metadata !== undefined;
  }
}
