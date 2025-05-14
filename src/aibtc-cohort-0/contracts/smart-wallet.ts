import { ContractApiClient } from "../api/client";
import { CONFIG } from "../../utilities";

export interface AgentAccountParams {
  ownerAddress: string;
  agentAddress?: string;
  daoTokenContract: string;
  daoTokenDexContract: string;
  network?: string;
}

export async function generateAgentAccount(params: AgentAccountParams) {
  const {
    ownerAddress,
    agentAddress = ownerAddress,
    daoTokenContract,
    daoTokenDexContract,
    network = CONFIG.NETWORK
  } = params;

  const apiClient = new ContractApiClient();
  
  try {
    // First get the agent account contract template
    const contractResponse = await apiClient.getContractByTypeAndSubtype("SMART_WALLET", "BASE");
    
    if (!contractResponse.contract) {
      throw new Error("Failed to retrieve agent account contract template");
    }
    
    const contractName = contractResponse.contract.name;
    
    // Generate the contract with replacements
    const customReplacements = {
      owner_address: ownerAddress,
      agent_address: agentAddress,
      dao_token_contract: daoTokenContract,
      dao_token_dex_contract: daoTokenDexContract
    };
    
    const generatedContract = await apiClient.generateContractForNetwork(
      contractName,
      network,
      "aibtc", // Default token symbol
      customReplacements
    );
    
    return generatedContract;
  } catch (error) {
    console.error("Error generating agent account:", error);
    throw error;
  }
}
