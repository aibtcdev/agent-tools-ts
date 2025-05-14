import { ContractApiClient } from "../api/client";
import { CONFIG } from "../../utilities";

export interface TokenParams {
  tokenName: string;
  tokenSymbol: string;
  tokenDecimals: number;
  tokenUri: string;
  tokenMaxSupply: number;
  network?: string;
}

export async function generateToken(params: TokenParams) {
  const {
    tokenName,
    tokenSymbol,
    tokenDecimals,
    tokenUri,
    tokenMaxSupply,
    network = CONFIG.NETWORK
  } = params;

  const apiClient = new ContractApiClient();
  
  try {
    // Get the token contract template
    const contractResponse = await apiClient.getContractByTypeAndSubtype("TOKEN", "SIP010");
    
    if (!contractResponse.contract) {
      throw new Error("Failed to retrieve token contract template");
    }
    
    const contractName = contractResponse.contract.name;
    
    // Generate the contract with replacements
    const customReplacements = {
      token_name: tokenName,
      token_symbol: tokenSymbol,
      token_decimals: tokenDecimals.toString(),
      token_uri: tokenUri,
      token_max_supply: tokenMaxSupply.toString()
    };
    
    const generatedContract = await apiClient.generateContractForNetwork(
      contractName,
      network,
      tokenSymbol,
      customReplacements
    );
    
    return generatedContract;
  } catch (error) {
    console.error("Error generating token contract:", error);
    throw error;
  }
}
