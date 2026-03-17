import { describe, test, expect, beforeAll } from "bun:test";
import { TokenInfoService, TokenMetadataError, TokenInfo, HiroTokenMetadataResponse } from "../src/api/token-info-service";
import { ContractCallsClient } from "../src/api/contract-calls-client";

// Test constants
const TESTNET_TOKEN_CONTRACT = "ST1Q9YZ2NY4KVBB08E005HAK3FSM8S3RX2WARP9Q1.fake17-faktory";
const MAINNET_TOKEN_CONTRACT = "SP2C2YFP12DJZ2DC69Z1W5MKBHFEMMGR0NJRJPN71.token-zbtc";

// Mock client for testing
class MockContractCallsClient {
  private mockMetadata: HiroTokenMetadataResponse | undefined;
  private shouldFailMetadata: boolean = false;
  private shouldFailContractCall: boolean = false;

  constructor(public network: "mainnet" | "testnet" = "testnet") {}

  setMockMetadata(metadata: HiroTokenMetadataResponse | undefined) {
    this.mockMetadata = metadata;
  }

  setShouldFailMetadata(shouldFail: boolean) {
    this.shouldFailMetadata = shouldFail;
  }

  setShouldFailContractCall(shouldFail: boolean) {
    this.shouldFailContractCall = shouldFail;
  }

  reset() {
    this.mockMetadata = undefined;
    this.shouldFailMetadata = false;
    this.shouldFailContractCall = false;
  }

  async getTokenMetadata<T>(tokenContract: string): Promise<T | undefined> {
    if (this.shouldFailMetadata) {
      throw new Error("Network error");
    }
    return this.mockMetadata as T | undefined;
  }

  async callContractFunction<T>(contractId: string, functionName: string): Promise<T> {
    if (this.shouldFailContractCall) {
      throw new Error("Contract call failed");
    }
    // Return mock values based on function name
    switch (functionName) {
      case "get-name":
        return "MockToken" as T;
      case "get-symbol":
        return "MOCK" as T;
      case "get-decimals":
        return "8" as T;
      case "get-total-supply":
        return "10000000000000000" as T;
      case "get-token-uri":
        return "https://example.com/token.json" as T;
      default:
        return undefined as T;
    }
  }

  async getAbi<T>(): Promise<T> {
    return {
      functions: [],
      variables: [],
      maps: [],
      fungible_tokens: [{ name: "mock-token" }],
      non_fungible_tokens: [],
    } as T;
  }
}

describe("TokenInfoService", () => {
  let service: TokenInfoService;
  let mockClient: MockContractCallsClient;

  beforeAll(() => {
    service = new TokenInfoService("testnet");
    // For unit tests, we'll manually inject a mock client
  });

  describe("TokenInfo interface", () => {
    test("should have all required fields", () => {
      const tokenInfo: TokenInfo = {
        name: "Test Token",
        symbol: "TEST",
        decimals: "8",
        totalSupply: "10000000000",
      };
      expect(tokenInfo.name).toBe("Test Token");
      expect(tokenInfo.symbol).toBe("TEST");
      expect(tokenInfo.decimals).toBe("8");
      expect(tokenInfo.totalSupply).toBe("10000000000");
    });

    test("should allow optional image fields", () => {
      const tokenInfo: TokenInfo = {
        name: "Test Token",
        symbol: "TEST",
        decimals: "8",
        totalSupply: "10000000000",
        tokenUri: "https://example.com/token.json",
        description: "A test token",
        imageUri: "https://example.com/image.png",
        imageThumbnailUri: "https://example.com/thumb.png",
        imageCanonicalUri: "https://example.com/canonical.png",
      };
      expect(tokenInfo.imageUri).toBe("https://example.com/image.png");
      expect(tokenInfo.imageThumbnailUri).toBe("https://example.com/thumb.png");
      expect(tokenInfo.imageCanonicalUri).toBe("https://example.com/canonical.png");
    });
  });

  describe("TokenMetadataError", () => {
    test("should create an error with contractId and reason", () => {
      const error = new TokenMetadataError("SP123.contract", "not found");
      expect(error.name).toBe("TokenMetadataError");
      expect(error.contractId).toBe("SP123.contract");
      expect(error.reason).toBe("not found");
      expect(error.message).toContain("SP123.contract");
      expect(error.message).toContain("not found");
    });

    test("should accept a cause error", () => {
      const cause = new Error("Network timeout");
      const error = new TokenMetadataError("SP123.contract", "network error", cause);
      expect(error.cause).toBe(cause);
    });
  });

  describe("HiroTokenMetadataResponse interface", () => {
    test("should have required fields", () => {
      const metadata: HiroTokenMetadataResponse = {
        name: "Test Token",
        symbol: "TEST",
        decimals: 8,
        total_supply: "10000000000",
        tx_id: "0x123456",
        sender_address: "SP123",
        asset_identifier: "SP123.token::test",
      };
      expect(metadata.name).toBe("Test Token");
      expect(metadata.decimals).toBe(8);
    });

    test("should allow optional image fields", () => {
      const metadata: HiroTokenMetadataResponse = {
        name: "Test Token",
        symbol: "TEST",
        decimals: 8,
        total_supply: "10000000000",
        tx_id: "0x123456",
        sender_address: "SP123",
        asset_identifier: "SP123.token::test",
        image_uri: "https://example.com/image.png",
        image_thumbnail_uri: "https://example.com/thumb.png",
        image_canonical_uri: "https://example.com/canonical.png",
      };
      expect(metadata.image_uri).toBe("https://example.com/image.png");
    });
  });
});

describe("TokenInfoService integration tests (requires network)", () => {
  // These tests require network access and are skipped by default
  // Run with: bun test --timeout 30000 tests/test-token-info-service.ts
  test.skip("should fetch token metadata from testnet", async () => {
    const service = new TokenInfoService("testnet");
    const metadata = await service.getTokenMetadataFromCache(TESTNET_TOKEN_CONTRACT);
    expect(metadata).toBeDefined();
    if (metadata) {
      expect(metadata.name).toBeDefined();
      expect(metadata.symbol).toBeDefined();
      expect(typeof metadata.decimals).toBe("number");
    }
  });

  test.skip("should get SIP-010 token info with image metadata", async () => {
    const service = new TokenInfoService("testnet");
    const tokenInfo = await service.getSIP010TokenInfo(TESTNET_TOKEN_CONTRACT);
    expect(tokenInfo.name).toBeDefined();
    expect(tokenInfo.symbol).toBeDefined();
    expect(tokenInfo.decimals).toBeDefined();
    expect(tokenInfo.totalSupply).toBeDefined();
    // Image fields should be present if metadata is available
  });

  test.skip("should throw TokenMetadataError when metadata not found", async () => {
    const service = new TokenInfoService("testnet");
    const invalidContract = "SP000000000000000000000000000000000000000.nonexistent-token";
    await expect(service.getTokenMetadata(invalidContract)).rejects.toThrow(TokenMetadataError);
  });

  test.skip("should check if token metadata exists", async () => {
    const service = new TokenInfoService("testnet");
    const hasMetadata = await service.hasTokenMetadata(TESTNET_TOKEN_CONTRACT);
    expect(typeof hasMetadata).toBe("boolean");
  });
});