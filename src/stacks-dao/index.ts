import { Executor } from "./lib/executor";
import { Treasury } from "./lib/treasury";
import { BankAccount } from "./lib/bank-account";
import { Messaging } from "./lib/messaging";
import { Payments } from "./lib/payments";
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

// Export types
export * from "./types";

// Named exports of all components
export { Executor } from "./lib/executor";
export { Treasury } from "./lib/treasury";
export { BankAccount } from "./lib/bank-account";
export { Messaging } from "./lib/messaging";
export { Payments } from "./lib/payments";
