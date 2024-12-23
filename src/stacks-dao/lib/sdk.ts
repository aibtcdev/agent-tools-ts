import { Executor } from "./executor";
import { Treasury } from "./treasury";
import { BankAccount } from "./bank-account";
import { Messaging } from "./messaging";
import { Payments } from "./payments";
import type { SDKOptions } from "../types";

export class DaoSDK {
  public executor: Executor;
  public treasury: Treasury;
  public bankAccount: BankAccount;
  public messaging: Messaging;
  public payments: Payments;

  constructor(options: SDKOptions = {}) {
    const config = {
      stacksApi: options.stacksApi || "https://api.testnet.hiro.so",
      network: options.network || "testnet",
    };

    this.executor = new Executor(config);
    this.treasury = new Treasury(config);
    this.bankAccount = new BankAccount(config);
    this.messaging = new Messaging(config);
    this.payments = new Payments(config);
  }
}
