import { expect, test, describe } from "bun:test";
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
  test("validateNetwork", () => {
    expect(validateNetwork("mainnet")).toBe("mainnet");
    expect(validateNetwork("testnet")).toBe("testnet");
    expect(validateNetwork("invalid")).toBe("testnet"); // default to testnet
  });

  test("microStxToStx and stxToMicroStx", () => {
    expect(microStxToStx(1000000)).toBe(1);
    expect(stxToMicroStx(1)).toBe(1000000);
  });

  test("deriveChildAccount", async () => {
    const account0 = await deriveChildAccount("testnet", mnemonic, 0);
    const account1 = await deriveChildAccount("testnet", mnemonic, 1);
    expect(account0).toHaveProperty("address");
    expect(account0).toHaveProperty("key");
    expect(account1).toHaveProperty("address");
    expect(account1).toHaveProperty("key");
    expect(account1.address).toEqual(stxAddress);
  });

  test("getNamesOwnedByAddress", async () => {
    const names = await getNamesOwnedByAddress("testnet", stxAddress);
    expect(Array.isArray(names)).toBeTruthy();
    expect(names).toContain(stxBnsName);
  });

  test("getAddressByName", async () => {
    const address = await getAddressByName("testnet", stxBnsName);
    expect(typeof address).toBe("string");
    expect(address).toEqual(stxAddress);
  });

  test("getNextNonce", async () => {
    const nonce = await getNextNonce("testnet", stxAddress);
    expect(typeof nonce).toBe("number");
  });

  test("getContractSource", async () => {
    const source = await getContractSource(
      "testnet",
      stxAddress,
      "aibtcdev-aibtc"
    );
    expect(typeof source).toBe("string");
  });

  test("getAddressBalance", async () => {
    const balance = await getAddressBalance("testnet", stxAddress);
    expect(balance).toHaveProperty("total");
    expect(balance).toHaveProperty("locked");
    expect(balance).toHaveProperty("unlocked");
  });
});

test.todo("Add more tests for edge cases and error handling");
