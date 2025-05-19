import { fetch } from "bun";
import { CONFIG } from "../../utilities";
import {
  ApiResponse,
  ContractsListResponse,
  ContractDetailResponse,
  ContractType,
  GeneratedDaoContractsResponse,
  GeneratedContractResponse,
} from "@aibtc/types";

export class ContractApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl =
      CONFIG.NETWORK === "mainnet"
        ? "https://daos.aibtc.dev/api"
        : // : "https://daos-staging.aibtc.dev/api";
          "https://aibtcdev-daos-preview.hosting-962.workers.dev/api";
  }

  async getAllContracts() {
    const response = await fetch(`${this.baseUrl}/contracts`);
    return (await response.json()) as ApiResponse<ContractsListResponse>;
  }

  async getDaoNames() {
    const response = await fetch(`${this.baseUrl}/dao-names`);
    return (await response.json()) as ApiResponse<ContractsListResponse>;
  }

  async getContractsByType(type: ContractType) {
    const response = await fetch(`${this.baseUrl}/by-type/${type}`);
    return (await response.json()) as ApiResponse<ContractsListResponse>;
  }

  async getContract(name: string) {
    const response = await fetch(`${this.baseUrl}/contract/${name}`);
    return (await response.json()) as ApiResponse<ContractDetailResponse>;
  }

  async getContractByTypeAndSubtype(type: ContractType, subtype: string) {
    const response = await fetch(
      `${this.baseUrl}/by-type-subtype/${type}/${subtype}`
    );
    return (await response.json()) as ApiResponse<ContractsListResponse>;
  }

  async generateContract(
    contractName: string,
    network: string = "devnet",
    tokenSymbol: string = "aibtc",
    customReplacements: Record<string, string> = {}
  ): Promise<ApiResponse<GeneratedContractResponse>> {
    try {
      console.log(
        `Generating contract for network: ${contractName} on ${network} with token ${tokenSymbol}`
      );
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

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response body:", errorText);
        throw new Error(
          `API request failed with status ${response.status}: ${errorText}`
        );
      }

      // Clone the response so we can inspect the raw text
      const responseClone = response.clone();
      const rawResponseText = await responseClone.text();
      console.log(
        "Raw response text (first 500 chars):",
        rawResponseText.substring(0, 500) +
          (rawResponseText.length > 500 ? "..." : "")
      );

      // Try to parse the JSON response
      const jsonResponse = JSON.parse(rawResponseText);
      console.log("Response structure:", Object.keys(jsonResponse));
      return jsonResponse as ApiResponse<GeneratedContractResponse>;
    } catch (error) {
      console.error("Error generating contract for network:", error);
      throw new Error(
        `Error generating contract for network: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  async generateDaoContracts(
    network: string = "devnet",
    tokenSymbol: string = "aibtc",
    customReplacements: Record<string, string> = {}
  ): Promise<ApiResponse<GeneratedDaoContractsResponse>> {
    const requestUrl = `${this.baseUrl}/generate-dao-contracts`;
    try {
      const response = await fetch(requestUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          network,
          tokenSymbol,
          customReplacements,
        }),
      });
      // catch error if response is not ok
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API request failed with status ${response.status}`);
        console.error("Error response body:", errorText);
        throw new Error(
          `API request failed with status ${response.status}: ${errorText}`
        );
      }
      // Try to parse the JSON response
      const jsonResponse =
        (await response.json()) as ApiResponse<GeneratedDaoContractsResponse>;
      return jsonResponse;
    } catch (error) {
      console.error("Error generating DAO contracts:", error);
      throw new Error(
        `Error generating DAO contracts: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  async generateAgentContract(
    network: string = "devnet",
    tokenSymbol: string = "aibtc",
    customReplacements: Record<string, string> = {}
  ): Promise<ApiResponse<GeneratedContractResponse>> {
    const requestUrl = `${this.baseUrl}/generate-agent-contract`;
    try {
      console.log(
        `Generating agent contract on ${network} with token ${tokenSymbol}`
      );
      const response = await fetch(requestUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          network,
          tokenSymbol,
          customReplacements,
        }),
      });

      console.log("Response status:", response.status);

      // catch error if response is not ok
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API request failed with status ${response.status}`);
        console.error("Error response body:", errorText);
        throw new Error(
          `API request failed with status ${response.status}: ${errorText}`
        );
      }

      // Clone the response so we can inspect the raw text
      const responseClone = response.clone();
      const rawResponseText = await responseClone.text();
      console.log(
        "Raw response text (first 500 chars):",
        rawResponseText.substring(0, 500) +
          (rawResponseText.length > 500 ? "..." : "")
      );

      // Try to parse the JSON response
      const jsonResponse = JSON.parse(rawResponseText);
      console.log("Response structure:", Object.keys(jsonResponse));
      return jsonResponse as ApiResponse<GeneratedContractResponse>;
    } catch (error) {
      console.error("Error generating agent contract:", error);
      throw new Error(
        `Error generating agent contract: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}
