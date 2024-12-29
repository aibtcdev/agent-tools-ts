import { expect, test, describe, it } from "bun:test";
import {
  validateNetwork,
  microStxToStx,
  stxToMicroStx,
  deriveChildAccount,
  getNextNonce,
  CONFIG,
  getTraitDefinition,
  getTraitReference,
} from "./utilities";

const TEST_MNEMONIC = CONFIG.MNEMONIC;
const TEST_STX_ADDRESS = "ST3GEF4KYM4V41FHC9NX0F7K0GW1VC6A4WPXNYQKS";

describe("Utility Functions", () => {
  describe("validateNetwork", () => {
    it("should accept valid network values", () => {
      const validNetworks = ["mainnet", "testnet", "devnet", "mocknet"];
      validNetworks.forEach(network => {
        expect(validateNetwork(network)).toBe(network);
      });
    });

    it("should default to testnet for invalid or missing inputs", () => {
      const invalidInputs = ["invalid", undefined, "", null];
      invalidInputs.forEach(input => {
        expect(validateNetwork(input as any)).toBe("testnet");
      });
    });
  });

  describe("STX conversion utilities", () => {
    const testCases = [
      { stx: 1, microStx: 1000000 },
      { stx: 0, microStx: 0 },
      { stx: 0.000001, microStx: 1 },
      { stx: 123.456789, microStx: 123456789 }
    ];

    testCases.forEach(({ stx, microStx }) => {
      it(`should correctly convert ${stx} STX to ${microStx} microSTX and back`, () => {
        expect(stxToMicroStx(stx)).toBe(microStx);
        expect(microStxToStx(microStx)).toBeCloseTo(stx, 6);
      });
    });

    it("should handle decimal precision correctly", () => {
      const original = 1.23456789;
      expect(microStxToStx(stxToMicroStx(original))).toBeCloseTo(original, 6);
    });
  });

  describe("deriveChildAccount", () => {
    it("should derive consistent accounts with expected properties", async () => {
      const accounts = await Promise.all([
        deriveChildAccount("testnet", TEST_MNEMONIC, 0),
        deriveChildAccount("testnet", TEST_MNEMONIC, 1)
      ]);

      accounts.forEach(account => {
        expect(account).toHaveProperty("address");
        expect(account.address).toMatch(/^ST/);
        expect(account).toHaveProperty("key");
        expect(typeof account.key).toBe("string");
      });

      expect(accounts[1].address).toEqual(TEST_STX_ADDRESS);
    });

    it("should derive different addresses for different indices", async () => {
      const [account0, account1] = await Promise.all([
        deriveChildAccount("testnet", TEST_MNEMONIC, 0),
        deriveChildAccount("testnet", TEST_MNEMONIC, 1)
      ]);
      expect(account0.address).not.toEqual(account1.address);
    });
  });

  describe("getNextNonce", () => {
    it("should return a valid nonce number", async () => {
      const nonce = await getNextNonce("testnet", TEST_STX_ADDRESS);
      expect(typeof nonce).toBe("number");
      expect(nonce).toBeGreaterThanOrEqual(0);
    });

    it("should handle API errors gracefully", async () => {
      const originalFetch = global.fetch;
      try {
        global.fetch = () => Promise.reject(new Error("Network error"));
        await expect(getNextNonce("testnet", TEST_STX_ADDRESS))
          .rejects
          .toThrow("Failed to fetch nonce");
      } finally {
        global.fetch = originalFetch;
      }
    });
  });

  describe("Trait utilities", () => {
    it("should return valid SIP010_FT trait definition for testnet", () => {
      const trait = getTraitDefinition("testnet", "SIP010_FT");
      expect(trait).toHaveProperty("contractAddress");
      expect(trait).toHaveProperty("contractName");
      expect(typeof trait.contractAddress).toBe("string");
      expect(typeof trait.contractName).toBe("string");
    });

    it("should return valid trait reference", () => {
      const trait = getTraitReference("testnet", "SIP010_FT");
      expect(typeof trait).toBe("string");
      expect(trait).toMatch(/^'.*::.*'$/);
    });
  });
});
