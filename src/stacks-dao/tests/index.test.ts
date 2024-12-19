import { expect, test, describe } from "bun:test";
import { CONFIG, deriveChildAccount } from "../../utilities";
import { DaoSDK } from "..";

const sdk = new DaoSDK({
  network: "testnet",
  baseUrl: "http://localhost:3000/api",
  // baseUrl -> aibtcdev-frontend API route
});

const { address, key } = await deriveChildAccount(
  CONFIG.NETWORK,
  CONFIG.MNEMONIC,
  CONFIG.ACCOUNT_INDEX
);

const TEST_SENDER_KEY = key;

describe("DAO SDK", () => {
  // Executor Tests
  test("should find executor contracts", async () => {
    try {
      const executors = await sdk.executor.findAll();
      console.log("Found executors:", executors);
      expect(Array.isArray(executors)).toBe(true);
    } catch (error) {
      console.error("Error finding executors:", error);
      throw error;
    }
  });

  test("should generate and deploy executor contract", async () => {
    try {
      // Generate contract code
      // const generatedExecutor = await sdk.executor.generate({
      //   name: "TestDao",
      //   extensions: [],
      //   includeDeployer: true,
      // });
      // console.log("Generated executor:", generatedExecutor.contract);
      // expect(generatedExecutor).toBeDefined();
      // expect(generatedExecutor.contract).toBeDefined();
      // Deploy contract
      // const deployedExecutor = await sdk.executor.deploy({
      //   name: "TestDao",
      //   extensions: [],
      //   includeDeployer: true,
      //   contractName: "test-dao-executor",
      //   senderKey: TEST_SENDER_KEY,
      //   fee: 1000000,
      // });
      // console.log("Deployed executor:", deployedExecutor);
      // expect(deployedExecutor).toBeDefined();
    } catch (error) {
      console.error("Error with executor:", error);
      throw error;
    }
  });

  // Treasury Tests
  test("should find treasury contracts", async () => {
    try {
      const treasuries = await sdk.treasury.findAll();
      console.log("Found treasuries:", treasuries);
      expect(Array.isArray(treasuries)).toBe(true);
    } catch (error) {
      console.error("Error finding treasuries:", error);
      throw error;
    }
  });

  test("should generate and deploy treasury contract", async () => {
    try {
      const daoContractId =
        "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.test-dao";
      const extensionTraitContractId =
        "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.extension-trait";
      const sip009TraitContractId =
        "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait";
      const sip010TraitContractId =
        "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.ft-trait";

      // Generate contract code
      // const generatedTreasury = await sdk.treasury.generate({
      //   name: "TestTreasury",
      //   daoContractId,
      //   extensionTraitContractId,
      //   sip009TraitContractId,
      //   sip010TraitContractId,
      // });
      // console.log("Generated treasury:", generatedTreasury);
      // expect(generatedTreasury).toBeDefined();
      // expect(generatedTreasury.contract).toBeDefined();

      // Deploy contract
      // const deployedTreasury = await sdk.treasury.deploy({
      //   name: "TestTreasury",
      //   daoContractId,
      //   extensionTraitContractId,
      //   sip009TraitContractId,
      //   sip010TraitContractId,
      //   contractName: "test-treasury",
      //   senderKey: TEST_SENDER_KEY,
      //   fee: 10000,
      // });
      // console.log("Deployed treasury:", deployedTreasury);
      // expect(deployedTreasury).toBeDefined();
    } catch (error) {
      console.error("Error with treasury:", error);
      throw error;
    }
  });

  // Bank Account Tests
  test("should find bank account contracts", async () => {
    try {
      const accounts = await sdk.bankAccount.findAll();
      console.log("Found bank accounts:", accounts);
      expect(Array.isArray(accounts)).toBe(true);
    } catch (error) {
      console.error("Error finding bank accounts:", error);
      throw error;
    }
  });

  test("should generate and deploy bank account contract", async () => {
    try {
      const daoContractId =
        "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.test-dao";
      const extensionTraitContractId =
        "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.extension-trait";

      // Generate contract code
      // const generatedAccount = await sdk.bankAccount.generate({
      //   name: "TestBankAccount",
      //   daoContractId,
      //   extensionTraitContractId,
      //   defaultWithdrawalPeriod: 144,
      //   defaultWithdrawalAmount: 1000000,
      // });
      // console.log("Generated bank account:", generatedAccount);
      // expect(generatedAccount).toBeDefined();
      // expect(generatedAccount.contract).toBeDefined();

      // Deploy contract
      // const deployedAccount = await sdk.bankAccount.deploy({
      //   name: "TestBankAccount",
      //   daoContractId,
      //   extensionTraitContractId,
      //   defaultWithdrawalPeriod: 144,
      //   defaultWithdrawalAmount: 1000000,
      //   contractName: "test-bank-account",
      //   senderKey: TEST_SENDER_KEY,
      //   fee: 10000,
      // });
      // console.log("Deployed bank account:", deployedAccount);
      // expect(deployedAccount).toBeDefined();
    } catch (error) {
      console.error("Error with bank account:", error);
      throw error;
    }
  });

  // Messaging Tests
  test("should generate and deploy messaging contract", async () => {
    try {
      const extensionTraitContractId =
        "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.extension-trait";

      // Generate contract code
      // const generatedMessaging = await sdk.messaging.generate({
      //   name: "TestMessaging",
      //   extensionTraitContractId,
      // });
      // console.log("Generated messaging:", generatedMessaging);
      // expect(generatedMessaging).toBeDefined();
      // expect(generatedMessaging.contract).toBeDefined();

      // Deploy contract
      // const deployedMessaging = await sdk.messaging.deploy({
      //   name: "TestMessaging",
      //   extensionTraitContractId,
      //   contractName: "test-messaging",
      //   senderKey: TEST_SENDER_KEY,
      //   fee: 10000,
      // });
      // console.log("Deployed messaging:", deployedMessaging);
      // expect(deployedMessaging).toBeDefined();
    } catch (error) {
      console.error("Error with messaging:", error);
      throw error;
    }
  });

  // Payments Tests
  test("should generate and deploy payments contract", async () => {
    try {
      const daoContractId =
        "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.test-dao";
      const extensionTraitContractId =
        "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.extension-trait";
      const paymentTraitsContractId =
        "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.payment-traits";

      // Generate contract code
      // const generatedPayments = await sdk.payments.generate({
      //   name: "TestPayments",
      //   daoContractId,
      //   extensionTraitContractId,
      //   paymentTraitsContractId,
      // });
      // console.log("Generated payments:", generatedPayments);
      // expect(generatedPayments).toBeDefined();
      // expect(generatedPayments.contract).toBeDefined();

      // Deploy contract
      // const deployedPayments = await sdk.payments.deploy({
      //   name: "TestPayments",
      //   daoContractId,
      //   extensionTraitContractId,
      //   paymentTraitsContractId,
      //   contractName: "test-payments",
      //   senderKey: TEST_SENDER_KEY,
      //   fee: 10000,
      // });
      // console.log("Deployed payments:", deployedPayments);
      // expect(deployedPayments).toBeDefined();
    } catch (error) {
      console.error("Error with payments:", error);
      throw error;
    }
  });

  // Integration Tests
  test("should generate and deploy full DAO with extensions", async () => {
    try {
      const daoContractId =
        "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.test-dao";
      const extensionTraitContractId =
        "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.extension-trait";
      const sip009TraitContractId =
        "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait";
      const sip010TraitContractId =
        "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.ft-trait";

      // Generate and deploy executor
      // const generatedExecutor = await sdk.executor.generate({
      //   name: "FullTestDao",
      //   extensions: [],
      //   includeDeployer: true,
      // });
      // console.log("Generated main DAO contract:", generatedExecutor);
      // expect(generatedExecutor).toBeDefined();

      // const deployedExecutor = await sdk.executor.deploy({
      //   name: "FullTestDao",
      //   extensions: [],
      //   includeDeployer: true,
      //   contractName: "full-test-dao",
      //   senderKey: TEST_SENDER_KEY,
      //   fee: 10000,
      // });
      // console.log("Deployed main DAO contract:", deployedExecutor);
      // expect(deployedExecutor).toBeDefined();

      // Generate and deploy treasury extension
      // const generatedTreasury = await sdk.treasury.generate({
      //   name: "FullTestDao",
      //   daoContractId,
      //   extensionTraitContractId,
      //   sip009TraitContractId,
      //   sip010TraitContractId,
      // });
      // console.log("Generated treasury extension:", generatedTreasury);
      // expect(generatedTreasury).toBeDefined();

      // const deployedTreasury = await sdk.treasury.deploy({
      //   name: "FullTestDao",
      //   daoContractId,
      //   extensionTraitContractId,
      //   sip009TraitContractId,
      //   sip010TraitContractId,
      //   contractName: "full-test-treasury",
      //   senderKey: TEST_SENDER_KEY,
      //   fee: 10000,
      // });
      // console.log("Deployed treasury extension:", deployedTreasury);
      // expect(deployedTreasury).toBeDefined();

      // Enable the extension
      // await sdk.executor.setExtension(
      //   deployedExecutor.metadata.contractId,
      //   deployedTreasury.metadata.contractId,
      //   true,
      //   {
      //     senderKey: TEST_SENDER_KEY,
      //     fee: 10000,
      //   }
      // );
      // console.log("Enabled treasury extension");
    } catch (error) {
      console.error("Error in full DAO deployment:", error);
      throw error;
    }
  });
});
