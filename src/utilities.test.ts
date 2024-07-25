import { expect, test, mock, describe } from "bun:test";
import {
  validateNetwork,
  microStxToStx,
  stxToMicroStx,
  deriveChildAccount,
  getNamesOwnedByAddress,
  getAddressByName,
  getNextNonce,
  getContractSource,
  getAddressBalance,
  CONFIG,
} from "./utilities";

const mnemonic = CONFIG.MNEMONIC;
const stxAddress = "ST3GEF4KYM4V41FHC9NX0F7K0GW1VC6A4WPXNYQKS";
const stxBnsName = "probablyhuman.btc";

describe("Utility Functions", () => {
  describe("validateNetwork", () => {
    test("handles valid networks", () => {
      expect(validateNetwork("mainnet")).toBe("mainnet");
      expect(validateNetwork("testnet")).toBe("testnet");
      expect(validateNetwork("devnet")).toBe("devnet");
      expect(validateNetwork("mocknet")).toBe("mocknet");
    });

    test("defaults to testnet for invalid inputs", () => {
      expect(validateNetwork("invalid")).toBe("testnet");
      expect(validateNetwork(undefined)).toBe("testnet");
      expect(validateNetwork("")).toBe("testnet");
    });
  });

  describe("STX conversion", () => {
    test("microStxToStx handles various inputs", () => {
      expect(microStxToStx(1000000)).toBe(1);
      expect(microStxToStx(0)).toBe(0);
      expect(microStxToStx(1)).toBe(0.000001);
    });

    test("stxToMicroStx handles various inputs", () => {
      expect(stxToMicroStx(1)).toBe(1000000);
      expect(stxToMicroStx(0)).toBe(0);
      expect(stxToMicroStx(0.000001)).toBe(1);
    });

    test("conversion roundtrip preserves value", () => {
      const original = 1.23456;
      expect(microStxToStx(stxToMicroStx(original))).toBeCloseTo(original, 5);
    });
  });

  describe("deriveChildAccount", () => {
    test("returns expected properties for multiple accounts", async () => {
      const account0 = await deriveChildAccount("testnet", mnemonic, 0);
      const account1 = await deriveChildAccount("testnet", mnemonic, 1);
      expect(account0).toHaveProperty("address");
      expect(account0).toHaveProperty("key");
      expect(account1).toHaveProperty("address");
      expect(account1).toHaveProperty("key");
      expect(account1.address).toEqual(stxAddress);
    });
  });

  describe("getNamesOwnedByAddress", () => {
    test("returns array containing expected name", async () => {
      const names = await getNamesOwnedByAddress("testnet", stxAddress);
      expect(Array.isArray(names)).toBeTruthy();
      expect(names).toContain(stxBnsName);
    });

    test("handles address with no names", async () => {
      const names = await getNamesOwnedByAddress(
        "testnet",
        "ST000000000000000000000000000000000"
      );
      expect(Array.isArray(names)).toBeTruthy();
      expect(names.length).toBe(0);
    });
  });

  describe("getAddressByName", () => {
    test("returns correct address for valid name", async () => {
      const address = await getAddressByName("testnet", stxBnsName);
      expect(typeof address).toBe("string");
      expect(address).toEqual(stxAddress);
    });

    test("handles non-existent name", async () => {
      expect(
        getAddressByName("testnet", "non-existent-name.btc")
      ).rejects.toThrow();
    });
  });

  describe("getNextNonce", () => {
    test("returns a number", async () => {
      const nonce = await getNextNonce("testnet", stxAddress);
      expect(typeof nonce).toBe("number");
    });

    test("handles API error", async () => {
      // store original fetch function to restore after test
      const originalFetch = global.fetch;

      try {
        // mock the global fetch function to simulate an API error
        global.fetch = mock(async () => {
          return new Response(JSON.stringify(""), {
            status: 500,
            statusText: "Internal Server Error",
          });
        });

        expect(getNextNonce("testnet", stxAddress)).rejects.toThrow(
          "Failed to get nonce: Internal Server Error"
        );
      } finally {
        // restore original fetch function
        global.fetch = originalFetch;
      }
    });
  });

  describe("getContractSource", () => {
    test("returns a string for valid contract", async () => {
      const source = await getContractSource(
        "testnet",
        stxAddress,
        "aibtcdev-aibtc"
      );
      expect(typeof source).toBe("string");
    });

    test("handles non-existent contract", async () => {
      expect(
        getContractSource("testnet", stxAddress, "non-existent-contract")
      ).rejects.toThrow();
    });
  });

  describe("getAddressBalance", () => {
    test("returns object with expected properties", async () => {
      const balance = await getAddressBalance("testnet", stxAddress);
      expect(balance).toHaveProperty("total");
      expect(balance).toHaveProperty("locked");
      expect(balance).toHaveProperty("unlocked");
    });

    test("handles zero balance", async () => {
      const balance = await getAddressBalance(
        "testnet",
        "ST000000000000000000000000000000000"
      );
      expect(balance.total).toBe("0");
      expect(balance.locked).toBe("0");
      expect(balance.unlocked).toBe("0");
    });
  });
});
