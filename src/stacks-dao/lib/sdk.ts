// src/stacks-dao/lib/sdk.ts

import { Executor } from "./executor";
import { Treasury } from "./treasury";
import { BankAccount } from "./bank-account";
import { Messaging } from "./messaging";
import { Payments } from "./payments";
import type { SDKOptions, BaseConfig } from "../types";
import { CONFIG, deriveChildAccount, getNetwork } from "../../utilities";

export class DaoSDK {
  private static instance: DaoSDK;
  public static key: string;

  public executor: Executor;
  public treasury: Treasury;
  public bankAccount: BankAccount;
  public messaging: Messaging;
  public payments: Payments;
  public address: string;
  private config: BaseConfig;

  static async create(options: SDKOptions = {}): Promise<DaoSDK> {
    if (!DaoSDK.instance) {
      const config = {
        stacksApi: options.stacksApi || "https://api.testnet.hiro.so",
        network: options.network || "testnet",
      };

      const { address, key } = await deriveChildAccount(
        CONFIG.NETWORK,
        CONFIG.MNEMONIC,
        CONFIG.ACCOUNT_INDEX
      );

      DaoSDK.key = key;
      DaoSDK.instance = new DaoSDK(config, address);
    }
    return DaoSDK.instance;
  }

  private constructor(config: BaseConfig, address: string) {
    this.config = config;
    this.address = address;

    this.executor = new Executor(config);
    this.treasury = new Treasury(config);
    this.bankAccount = new BankAccount(config);
    this.messaging = new Messaging(config);
    this.payments = new Payments(config);
  }

  getNetwork(): "mainnet" | "testnet" {
    return this.config.network;
  }
}
