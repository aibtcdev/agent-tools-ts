import { fetch } from "bun";
import { CONFIG } from "../../utilities";

export class ContractApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = CONFIG.NETWORK === "mainnet" 
      ? "https://daos.aibtc.dev" 
      : "https://daos-staging.aibtc.dev";
  }

  async getAllContracts() {
    const response = await fetch(`${this.baseUrl}/contracts`);
    return await response.json();
  }

  async getDaoNames() {
    const response = await fetch(`${this.baseUrl}/dao-names`);
    return await response.json();
  }

  async getContractsByType(type: string) {
    const response = await fetch(`${this.baseUrl}/by-type/${type}`);
    return await response.json();
  }

  async getContract(name: string) {
    const response = await fetch(`${this.baseUrl}/contract/${name}`);
    return await response.json();
  }

  async getContractByTypeAndSubtype(type: string, subtype: string) {
    const response = await fetch(`${this.baseUrl}/by-type-subtype/${type}/${subtype}`);
    return await response.json();
  }

  async generateContract(contractName: string, replacements: Record<string, any> = {}) {
    const response = await fetch(`${this.baseUrl}/generate-contract`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contractName,
        replacements
      })
    });
    return await response.json();
  }

  async generateContractForNetwork(
    contractName: string, 
    network: string = "devnet", 
    tokenSymbol: string = "aibtc",
    customReplacements: Record<string, any> = {}
  ) {
    const response = await fetch(`${this.baseUrl}/generate-contract-for-network`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contractName,
        network,
        tokenSymbol,
        customReplacements
      })
    });
    return await response.json();
  }

  async generateDaoContracts(
    network: string = "devnet",
    tokenSymbol: string = "aibtc",
    customReplacements: Record<string, any> = {}
  ) {
    const response = await fetch(`${this.baseUrl}/generate-dao-contracts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        network,
        tokenSymbol,
        customReplacements
      })
    });
    return await response.json();
  }
}
