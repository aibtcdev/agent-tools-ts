// src/stacks-dao/lib/base.ts

import {
  makeContractCall,
  makeContractDeploy,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  getAddressFromPrivateKey,
  TransactionVersion,
  cvToValue,
  hexToCV,
} from "@stacks/transactions";
import { StacksNetwork, StacksMainnet, StacksTestnet } from "@stacks/network";
import { createClient } from "@stacks/blockchain-api-client";
import type {
  BaseConfig,
  TransactionOptions,
  ReadOnlyOptions,
  SearchOptions,
  ContractDeployOptions,
} from "../types";
import { DaoSDK } from "./sdk";
import path from "path";

export class BaseComponent {
  protected config: BaseConfig;
  protected network: StacksNetwork;
  protected client;

  constructor(config: BaseConfig) {
    if (!DaoSDK.key) {
      throw new Error("SDK not initialized. Call DaoSDK.create() first");
    }

    this.config = config;
    this.network = this.getNetwork();
    this.client = createClient({
      baseUrl: this.config.stacksApi,
    });

    // Add API key if available
    this.client.use({
      onRequest({ request }) {
        if (process.env.HIRO_API_KEY) {
          request.headers.set("x-hiro-api-key", process.env.HIRO_API_KEY);
        }
        return request;
      },
    });
  }

  protected getNetwork(): StacksNetwork {
    return this.config.network === "mainnet"
      ? new StacksMainnet()
      : new StacksTestnet();
  }

  protected async getContractById(contractId: string) {
    const { data } = await this.client.GET(
      "/extended/v1/contract/{contract_id}",
      {
        params: {
          path: { contract_id: contractId },
        },
      }
    );
    return data;
  }

  protected async makeContractCall(options: TransactionOptions): Promise<any> {
    const {
      contractAddress,
      contractName,
      functionName,
      functionArgs,
      anchorMode = AnchorMode.Any,
      postConditionMode = PostConditionMode.Deny,
      postConditions = [],
      fee = 10000,
      nonce,
      onFinish,
      onCancel,
    } = options;

    if (!DaoSDK.key) {
      throw new Error("SDK not initialized");
    }

    const txOptions = {
      contractAddress,
      contractName,
      functionName,
      functionArgs,
      senderKey: DaoSDK.key,
      network: this.network,
      anchorMode,
      postConditionMode,
      postConditions,
      fee: BigInt(fee),
      nonce: nonce ? BigInt(nonce) : undefined,
      onFinish,
      onCancel,
    };

    const transaction = await makeContractCall(txOptions);
    const broadcastResponse = await broadcastTransaction(
      transaction,
      this.network
    );

    // Get transaction status if we have a txid
    if (broadcastResponse.txid) {
      const txData = await this.client.GET("/extended/v1/tx/{tx_id}", {
        params: {
          path: { tx_id: broadcastResponse.txid },
        },
      });
      return { ...broadcastResponse, transaction: txData.data };
    }

    return broadcastResponse;
  }

  protected async makeContractDeploy(
    options: ContractDeployOptions
  ): Promise<any> {
    const {
      contractName,
      codeBody,
      anchorMode = AnchorMode.Any,
      postConditionMode = PostConditionMode.Deny,
      postConditions = [],
      fee = 100000,
      onFinish,
      onCancel,
    } = options;

    if (!DaoSDK.key) {
      throw new Error("SDK not initialized");
    }

    const address = getAddressFromPrivateKey(
      DaoSDK.key,
      this.config.network === "mainnet"
        ? TransactionVersion.Mainnet
        : TransactionVersion.Testnet
    );

    const txOptions = {
      clarityVersion: 3,
      codeBody,
      contractName,
      senderKey: DaoSDK.key,
      network: this.network,
      anchorMode,
      postConditionMode,
      postConditions,
      fee: BigInt(fee),
      onFinish,
      onCancel,
    };

    const transaction = await makeContractDeploy(txOptions);
    const broadcastResponse = await broadcastTransaction(
      transaction,
      this.network
    );

    return {
      ...broadcastResponse,
      contractId: `${address}.${contractName}`,
    };
  }

  protected async callReadOnlyFunction(options: ReadOnlyOptions): Promise<any> {
    const {
      contractAddress,
      contractName,
      functionName,
      functionArgs,
      senderAddress = contractAddress,
    } = options;

    const result = await this.client.POST(
      "/v2/contracts/call-read/{address}/{contract_name}/{function_name}" as any,
      {
        params: {
          path: {
            address: contractAddress,
            contract_name: contractName,
            function_name: functionName,
          },
        },
        body: {
          sender: senderAddress,
          arguments: functionArgs.map((arg) => arg.toString()),
        },
      }
    );

    return cvToValue(hexToCV(result.data.result));
  }

  protected async findContractsByTrait(
    traitAbi: any,
    options: SearchOptions = {}
  ): Promise<string[]> {
    const { limit = 50, offset = 0 } = options;

    const { data } = await this.client.GET("/extended/v1/contract/by_trait", {
      params: {
        query: {
          trait_abi: JSON.stringify(traitAbi),
          limit: limit,
          offset: offset,
        },
      },
    });

    if (!data) {
      return [];
    }

    return data.results.map((r: any) => r.contract_id);
  }

  protected async getContractEvents(
    contractId: string,
    limit = 20,
    offset = 0
  ): Promise<any> {
    const { data } = await this.client.GET(
      "/extended/v1/contract/{contract_id}/events",
      {
        params: {
          path: { contract_id: contractId },
          query: {
            limit,
            offset,
          },
        },
      }
    );
    return data;
  }
}
