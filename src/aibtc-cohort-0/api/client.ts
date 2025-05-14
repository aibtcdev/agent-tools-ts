import { fetch } from "bun";
import { CONFIG } from "../../utilities";
import {
  ApiResponse,
  ContractsListResponse,
  ContractDetailResponse,
  GeneratedContractResponse,
  ContractType,
  ContractInfo,
} from "@aibtc/types";

export class ContractApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl =
      CONFIG.NETWORK === "mainnet"
        ? "https://daos.aibtc.dev"
        : "https://daos-staging.aibtc.dev";
  }

  async getAllContracts(): Promise<ApiResponse<ContractsListResponse>> {
    const response = await fetch(`${this.baseUrl}/contracts`);
    return await response.json();
  }

  async getDaoNames(): Promise<ApiResponse<string[]>> {
    const response = await fetch(`${this.baseUrl}/dao-names`);
    return await response.json();
  }

  async getContractsByType(
    type: ContractType
  ): Promise<ApiResponse<ContractsListResponse>> {
    const response = await fetch(`${this.baseUrl}/by-type/${type}`);
    return await response.json();
  }

  async getContract(
    name: string
  ): Promise<ApiResponse<ContractDetailResponse>> {
    const response = await fetch(`${this.baseUrl}/contract/${name}`);
    return await response.json();
  }

  async getContractByTypeAndSubtype(
    type: ContractType,
    subtype: string
  ): Promise<ApiResponse<ContractInfo>> {
    const response = await fetch(
      `${this.baseUrl}/by-type-subtype/${type}/${subtype}`
    );
    return await response.json();
  }

  async generateContract(
    contractName: string,
    replacements: Record<string, any> = {}
  ): Promise<ApiResponse<GeneratedContractResponse>> {
    const response = await fetch(`${this.baseUrl}/generate-contract`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contractName,
        replacements,
      }),
    });
    return await response.json();
  }

  async generateContractForNetwork(
    contractName: string,
    network: string = "devnet",
    tokenSymbol: string = "aibtc",
    customReplacements: Record<string, any> = {}
  ): Promise<ApiResponse<GeneratedContractResponse>> {
    const response = await fetch(
      `${this.baseUrl}/generate-contract-for-network`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractName,
          network,
          tokenSymbol,
          customReplacements,
        }),
      }
    );
    return await response.json();
  }

  async generateDaoContracts(
    network: string = "devnet",
    tokenSymbol: string = "aibtc",
    customReplacements: Record<string, any> = {}
  ): Promise<ApiResponse<Record<string, GeneratedContractResponse>>> {
    const response = await fetch(`${this.baseUrl}/generate-dao-contracts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        network,
        tokenSymbol,
        customReplacements,
      }),
    });
    return await response.json();
  }
}
