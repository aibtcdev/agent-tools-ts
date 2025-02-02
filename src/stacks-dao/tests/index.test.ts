import { expect, test, describe, beforeAll } from "bun:test";
import { DaoSDK } from "../lib/sdk";

const TEST_DAO =
  "ST2D5BGGJ956A635JG7CJQ59FTRFRB08934NHKJ95.test-dao-1734938378667-executor";
const TEST_TREASURY =
  "ST2D5BGGJ956A635JG7CJQ59FTRFRB08934NHKJ95.test-dao-1734942153203-treasury";

// Test configuration
let sdk: DaoSDK;
let daoName: string;
let executorId: string;

beforeAll(async () => {
  // Set up test environment
  sdk = await DaoSDK.create();
  daoName = `test-dao-${Date.now()}`; // Unique name for each test run
});

describe("Executor Tests", () => {
  test("should list extensions", async () => {
    const result = await sdk.executor.listExtensions(
      "aibtcdev-executor-1735224645736"
    );
    console.log(result);
  });
  test("should generate a proposal", async () => {
    const result = await sdk.proposal.generate({
      type: "add-extension",
      executorId: `ST2D5BGGJ956A635JG7CJQ59FTRFRB08934NHKJ95.${daoName}`,
      extensionId: "ST2D5BGGJ956A635JG7CJQ59FTRFRB08934NHKJ95",
    });
    console.log(result);
  });
  test("should generate executor contract", async () => {
    const result = await sdk.executor.generate({
      mission:
        "to increase the marketcap and total active holders of welshcorgicoin",
    });
    console.log(result);

    expect(result.contract).toBeDefined();
    expect(result.contract).toContain("executor-trait");
  });

  test("should deploy executor contract", async () => {
    const result = await sdk.executor.deploy({
      mission:
        "to increase the marketcap and total active holders of welshcorgicoin",
      fee: 400000,
    });
    console.log(result);

    expect(result).toBeDefined();
    expect(result.txid).toBeDefined();
  });

  test("should find executor contracts", async () => {
    const executors = await sdk.executor.findAll();
    expect(Array.isArray(executors)).toBe(true);
    expect(executors.length).toBeGreaterThan(0);
  });

  test("should set extension", async () => {
    const extensionAddress = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    const result = await sdk.executor.setExtension(
      TEST_DAO,
      extensionAddress,
      true
    );

    expect(result).toBeDefined();
    expect(result.txid).toBeDefined();
  });
});

describe("Treasury Tests", () => {
  let treasuryId: string;

  test("should generate treasury contract", async () => {
    const result = await sdk.treasury.generate({
      daoContractId: TEST_DAO,
    });

    expect(result.contract).toBeDefined();
    expect(result.contract).toContain(daoName);
    expect(result.contract).toContain("treasury-trait");
  });

  test("should deploy treasury contract", async () => {
    const result = await sdk.treasury.deploy({
      daoContractId: TEST_DAO,
      fee: 400000,
    });

    expect(result).toBeDefined();
    expect(result.txid).toBeDefined();
  });

  test("should deposit STX", async () => {
    const result = await sdk.treasury.depositStx(
      TEST_TREASURY,
      100000 // 0.1 STX
    );

    expect(result).toBeDefined();
    expect(result.txid).toBeDefined();
  });

  test("should withdraw STX", async () => {
    const recipient = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    const result = await sdk.treasury.withdrawStx(
      TEST_TREASURY,
      50000, // 0.05 STX
      recipient
    );

    expect(result).toBeDefined();
    expect(result.txid).toBeDefined();
  });
});
