import { Executor } from "./executor";
import { Treasury } from "./treasury";
import { Messaging } from "./messaging";
import { Payments } from "./payments";
import type { SDKOptions, BaseConfig } from "../types";
import { CONFIG, deriveChildAccount } from "../../utilities";
import { Proposal } from "./proposal";

export class DaoSDK {
  private static instance: DaoSDK;
  public static key: string;
  private config: BaseConfig;

  public executor: Executor;
  public proposal: Proposal;
  public treasury: Treasury;
  public messaging: Messaging;
  public payments: Payments;
  public address: string;

  static async create(options: SDKOptions = {}): Promise<DaoSDK> {
    if (!DaoSDK.instance) {
      const config = {
        stacksApi: options.stacksApi || "https://api.testnet.hiro.so",
        network: options.network || CONFIG.NETWORK,
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
    this.proposal = new Proposal(config);
    this.treasury = new Treasury(config);
    this.messaging = new Messaging(config);
    this.payments = new Payments(config);
  }

  getNetwork(): "mainnet" | "testnet" {
    return this.config.network;
  }
}
