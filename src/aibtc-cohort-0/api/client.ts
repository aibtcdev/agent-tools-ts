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
      console.log(`Generating contract: ${contractName}`);
      const response = await fetch(`${this.baseUrl}/generate-contract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractName,
          replacements,
        }),
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response body:", errorText);
        return {
          success: false,
          message: `API request failed with status ${response.status}: ${errorText}`,
          data: null,
        };
      }

      // Clone the response so we can inspect the raw text
      const responseClone = response.clone();
      const rawResponseText = await responseClone.text();
      console.log(
        "Raw response text (first 500 chars):",
        rawResponseText.substring(0, 500) +
          (rawResponseText.length > 500 ? "..." : "")
      );

      try {
        // Try to parse the JSON response
        const jsonResponse = JSON.parse(rawResponseText);
        console.log("Response structure:", Object.keys(jsonResponse));

        if (jsonResponse && typeof jsonResponse === "object") {
          if ("success" in jsonResponse) {
            return jsonResponse;
          } else if ("source" in jsonResponse || "code" in jsonResponse) {
            // It has source or code field which is common for contract responses
            return {
              success: true,
              message: "Successfully generated contract",
              data: jsonResponse,
            };
          } else {
            return {
              success: true,
              message: "Successfully generated contract",
              data: jsonResponse,
            };
          }
        } else {
          console.error(
            "Invalid response format - not an object:",
            typeof jsonResponse
          );
          return {
            success: false,
            message: "Invalid response format from API - not an object",
            data: null,
          };
        }
      } catch (parseError) {
        console.error("Failed to parse JSON response:", parseError);
        console.error(
          "Raw response excerpt:",
          rawResponseText.substring(0, 1000)
        );

        return {
          success: false,
          message: `Failed to parse JSON response: ${
            parseError instanceof Error ? parseError.message : "Unknown error"
          }`,
          data: null,
        };
      }
    } catch (error) {
      console.error("Error generating contract:", error);
      return {
        success: false,
        message: `Failed to generate contract: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        data: null,
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
        return {
          success: false,
          message: `API request failed with status ${response.status}: ${errorText}`,
          data: null,
        };
      }

      // Clone the response so we can inspect the raw text
      const responseClone = response.clone();
      const rawResponseText = await responseClone.text();
      console.log(
        "Raw response text (first 500 chars):",
        rawResponseText.substring(0, 500) +
          (rawResponseText.length > 500 ? "..." : "")
      );

      try {
        // Try to parse the JSON response
        const jsonResponse = JSON.parse(rawResponseText);
        console.log("Response structure:", Object.keys(jsonResponse));

        if (jsonResponse && typeof jsonResponse === "object") {
          if ("success" in jsonResponse) {
            return jsonResponse;
          } else if ("source" in jsonResponse || "code" in jsonResponse) {
            // It has source or code field which is common for contract responses
            return {
              success: true,
              message: "Successfully generated contract for network",
              data: jsonResponse,
            };
          } else {
            return {
              success: true,
              message: "Successfully generated contract for network",
              data: jsonResponse,
            };
          }
        } else {
          console.error(
            "Invalid response format - not an object:",
            typeof jsonResponse
          );
          return {
            success: false,
            message: "Invalid response format from API - not an object",
            data: null,
          };
        }
      } catch (parseError) {
        console.error("Failed to parse JSON response:", parseError);
        console.error(
          "Raw response excerpt:",
          rawResponseText.substring(0, 1000)
        );

        return {
          success: false,
          message: `Failed to parse JSON response: ${
            parseError instanceof Error ? parseError.message : "Unknown error"
          }`,
          data: null,
        };
      }
    } catch (error) {
      console.error("Error generating contract for network:", error);
      return {
        success: false,
        message: `Failed to generate contract for network: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        data: null,
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
      console.log("Sending request to generate DAO contracts...");
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
      console.log(
        "Response headers:",
        Object.fromEntries(response.headers.entries())
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response body:", errorText);
        return {
          success: false,
          message: `API request failed with status ${response.status}: ${errorText}`,
          data: null,
        };
      }

      // Clone the response so we can inspect the raw text
      const responseClone = response.clone();
      const rawResponseText = await responseClone.text();
      console.log(
        "Raw response text (first 500 chars):",
        rawResponseText.substring(0, 500) +
          (rawResponseText.length > 500 ? "..." : "")
      );

      try {
        // Try to parse the JSON response
        const jsonResponse = JSON.parse(rawResponseText);
        console.log("Response structure:", Object.keys(jsonResponse));
        // Check if the response has the expected structure
        if (jsonResponse && typeof jsonResponse === "object") {
          if ("success" in jsonResponse) {
            // It's already in our expected format
            console.log("Response is in expected format with 'success' field");
            return jsonResponse;
          } else if ("data" in jsonResponse || "contracts" in jsonResponse) {
            // It has data or contracts field
            const dataField = jsonResponse.data || jsonResponse.contracts;
            console.log(
              "Response has data/contracts field:",
              Object.keys(dataField || {})
            );
            return {
              success: true,
              message: "Successfully generated DAO contracts",
              data: dataField || jsonResponse,
            };
          } else {
            // Assume the entire response is the data
            console.log("Treating entire response as data");
            return {
              success: true,
              message: "Successfully generated DAO contracts",
              data: jsonResponse,
            };
          }
        } else {
          console.error(
            "Invalid response format - not an object:",
            typeof jsonResponse
          );
          return {
            success: false,
            message: "Invalid response format from API - not an object",
            data: null,
          };
        }
      } catch (parseError) {
        console.error("Failed to parse JSON response:", parseError);
        console.error(
          "Raw response excerpt:",
          rawResponseText.substring(0, 1000)
        );
        return {
          success: false,
          message: `Failed to parse JSON response: ${
            parseError instanceof Error ? parseError.message : "Unknown error"
          }`,
          data: null,
        };
      }
    } catch (error) {
      console.error("Error generating DAO contracts:", error);
      return {
        success: false,
        message: `Failed to generate DAO contracts: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        data: null,
      };
    }
  }
  /**
   * Helper method to extract contract code from potentially malformed responses
   * This can handle both proper JSON responses and responses that might contain
   * search/replace blocks or other unexpected formats
   */
  extractContractCode(
    rawResponse: string
  ): ApiResponse<GeneratedContractResponse> {
    try {
      // First try to parse as JSON
      const jsonResponse = JSON.parse(rawResponse);
      if (jsonResponse && typeof jsonResponse === "object") {
        if ("success" in jsonResponse) {
          return jsonResponse;
        } else if ("source" in jsonResponse || "code" in jsonResponse) {
          return {
            success: true,
            message: "Successfully extracted contract code",
            data: jsonResponse,
          };
        } else {
          return {
            success: true,
            message: "Successfully extracted response",
            data: jsonResponse,
          };
        }
      }
      return {
        success: false,
        message: "Could not extract contract code from response",
        data: null,
      };
    } catch (error) {
      console.error("Failed to parse JSON response:", error);
      // If we can't extract anything useful, return an error
      return {
        success: false,
        message: `Failed to extract contract code: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        data: null,
      };
    }
  }
}
