import { Executor } from "./executor";
import { Treasury } from "./treasury";
import { BankAccount } from "./bank-account";
import { Messaging } from "./messaging";
import { Payments } from "./payments";
import type { SDKOptions } from "./types";

export class DaoSDK {
  public executor: Executor;
  public treasury: Treasury;
  public bankAccount: BankAccount;
  public messaging: Messaging;
  public payments: Payments;

  constructor(options: SDKOptions = {}) {
    const config = {
      baseUrl: options.baseUrl || "/api",
      stacksApi: options.stacksApi || "https://api.mainnet.hiro.so",
      network: options.network || "mainnet",
    };

    this.executor = new Executor(config);
    this.treasury = new Treasury(config);
    this.bankAccount = new BankAccount(config);
    this.messaging = new Messaging(config);
    this.payments = new Payments(config);
  }
}

// Types export
export * from "./types";

// Default export
export default DaoSDK;

/* Usage example:
const sdk = new DaoSDK({
  network: 'mainnet',
  baseUrl: '/api'
});

// Work with executors
const executors = await sdk.executor.findAll();
const newExecutor = await sdk.executor.deploy({ name: 'MyDao' });
await sdk.executor.setExtension(executorId, extensionId, true);

// Work with treasury
const treasuries = await sdk.treasury.findAll();
const newTreasury = await sdk.treasury.deploy({ 
  name: 'MyDao',
  daoContractId: executorId 
});
await sdk.treasury.depositStx(treasuryId, amount);
*/
