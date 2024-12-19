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

export class BaseComponent {
  protected config: BaseConfig;
  protected network: StacksNetwork;
  protected client;

  constructor(config: BaseConfig) {
    this.config = config;
    this.network = this.getNetwork();
    this.client = createClient({
      baseUrl: this.config.stacksApi,
    });

    this.client.use({
      onRequest({ request }) {
        request.headers.set("x-hiro-api-key", String(process.env.HIRO_API_KEY));
        return request;
      },
    });
  }

  protected getNetwork(): StacksNetwork {
    return this.config.network === "mainnet"
      ? new StacksMainnet()
      : new StacksTestnet();
  }

  protected async fetchApi<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
      method: data ? "POST" : "GET",
      headers: {
        "Content-Type": "application/json",
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const error: any = await response.json();
      throw new Error(error.error || "API request failed");
    }

    return response.json() as T;
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

  protected async callReadOnlyFunction(options: ReadOnlyOptions) {
    const {
      contractAddress,
      contractName,
      functionName,
      functionArgs,
      senderAddress = contractAddress,
    } = options;

    const response = await this.client.POST(
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

    return cvToValue(hexToCV(response.data.result));
  }

  protected async findContractsByTrait(
    traitAbi: any,
    options: SearchOptions = {}
  ) {
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

  protected async makeContractDeploy(
    options: ContractDeployOptions
  ): Promise<any> {
    const {
      contractName,
      codeBody,
      senderKey,
      anchorMode = AnchorMode.Any,
      postConditionMode = PostConditionMode.Deny,
      postConditions = [],
      fee = 10000,
      onFinish,
      onCancel,
    } = options;

    if (!senderKey) {
      throw new Error("Sender key is required for contract deployment");
    }

    const address = getAddressFromPrivateKey(
      senderKey,
      this.config.network === "mainnet"
        ? TransactionVersion.Mainnet
        : TransactionVersion.Testnet
    );

    const deployOptions = {
      clarityVersion: 3,
      codeBody,
      contractName,
      senderKey,
      network: this.network,
      anchorMode,
      postConditionMode,
      postConditions,
      fee: BigInt(fee),
      onFinish,
      onCancel,
    };

    const transaction = await makeContractDeploy(deployOptions);
    const broadcastResponse = await broadcastTransaction(
      transaction,
      this.network
    );

    // Get transaction status
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

  protected async makeContractCall(options: TransactionOptions): Promise<any> {
    const {
      contractAddress,
      contractName,
      functionName,
      functionArgs,
      senderKey,
      anchorMode = AnchorMode.Any,
      postConditionMode = PostConditionMode.Deny,
      postConditions = [],
      fee = 10000,
      nonce,
      onFinish,
      onCancel,
    } = options;

    if (!senderKey) {
      throw new Error("Sender key is required for contract calls");
    }

    const address = getAddressFromPrivateKey(
      senderKey,
      this.config.network === "mainnet"
        ? TransactionVersion.Mainnet
        : TransactionVersion.Testnet
    );

    const txOptions = {
      contractAddress,
      contractName,
      functionName,
      functionArgs,
      senderKey,
      network: this.network,
      anchorMode,
      postConditionMode,
      postConditions,
      fee: BigInt(fee),
      onFinish,
      onCancel,
    };

    const transaction = await makeContractCall(txOptions);
    const broadcastResponse = await broadcastTransaction(
      transaction,
      this.network
    );

    // Get transaction status
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
}
