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
        ? "https://daos.aibtc.dev/api"
        : "https://daos-staging.aibtc.dev/api";
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
    try {
      const response = await fetch(`${this.baseUrl}/generate-contract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractName,
          replacements,
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response body:", errorText);
        return {
          success: false,
          message: `API request failed with status ${response.status}: ${errorText}`,
          data: null
        };
      }
      
      const jsonResponse = await response.json();
      
      if (jsonResponse && typeof jsonResponse === 'object') {
        if ('success' in jsonResponse) {
          return jsonResponse;
        } else {
          return {
            success: true,
            message: "Successfully generated contract",
            data: jsonResponse
          };
        }
      } else {
        return {
          success: false,
          message: "Invalid response format from API",
          data: null
        };
      }
    } catch (error) {
      console.error("Error generating contract:", error);
      return {
        success: false,
        message: `Failed to generate contract: ${error instanceof Error ? error.message : "Unknown error"}`,
        data: null
      };
    }
  }

  async generateContractForNetwork(
    contractName: string,
    network: string = "devnet",
    tokenSymbol: string = "aibtc",
    customReplacements: Record<string, any> = {}
  ): Promise<ApiResponse<GeneratedContractResponse>> {
    try {
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
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response body:", errorText);
        return {
          success: false,
          message: `API request failed with status ${response.status}: ${errorText}`,
          data: null
        };
      }
      
      const jsonResponse = await response.json();
      
      if (jsonResponse && typeof jsonResponse === 'object') {
        if ('success' in jsonResponse) {
          return jsonResponse;
        } else {
          return {
            success: true,
            message: "Successfully generated contract for network",
            data: jsonResponse
          };
        }
      } else {
        return {
          success: false,
          message: "Invalid response format from API",
          data: null
        };
      }
    } catch (error) {
      console.error("Error generating contract for network:", error);
      return {
        success: false,
        message: `Failed to generate contract for network: ${error instanceof Error ? error.message : "Unknown error"}`,
        data: null
      };
    }
  }

  async generateDaoContracts(
    network: string = "devnet",
    tokenSymbol: string = "aibtc",
    customReplacements: Record<string, any> = {}
  ): Promise<ApiResponse<Record<string, GeneratedContractResponse>>> {
    const requestUrl = `${this.baseUrl}/generate-dao-contracts`;
    console.log(
      `Generating DAO contracts for network: ${network}, tokenSymbol: ${tokenSymbol}`
    );
    console.log("Request URL:", requestUrl);
    console.log("Custom replacements:", customReplacements);
    
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
      
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response body:", errorText);
        return {
          success: false,
          message: `API request failed with status ${response.status}: ${errorText}`,
          data: null
        };
      }
      
      // Parse the JSON response
      const jsonResponse = await response.json();
      
      // Check if the response has the expected structure
      if (jsonResponse && typeof jsonResponse === 'object') {
        if ('success' in jsonResponse) {
          // It's already in our expected format
          return jsonResponse;
        } else {
          // Wrap the response in our expected format
          return {
            success: true,
            message: "Successfully generated DAO contracts",
            data: jsonResponse
          };
        }
      } else {
        return {
          success: false,
          message: "Invalid response format from API",
          data: null
        };
      }
    } catch (error) {
      console.error("Error generating DAO contracts:", error);
      return {
        success: false,
        message: `Failed to generate DAO contracts: ${error instanceof Error ? error.message : "Unknown error"}`,
        data: null
      };
    }
  }
}
