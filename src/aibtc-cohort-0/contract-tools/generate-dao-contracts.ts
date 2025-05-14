import { ContractApiClient } from "../api/client";

export interface DeployDaoParams {
  tokenSymbol: string;
  tokenName: string;
  tokenMaxSupply: number;
  tokenUri: string;
  logoUrl: string;
  originAddress: string;
  daoManifest: string;
  tweetOrigin: string;
  daoManifestInscriptionId?: string;
  network?: string;
}

export async function generateDaoContracts(
  tokenSymbol: string,
  network: string = "devnet",
  customReplacements: Record<string, any> = {}
) {
  const apiClient = new ContractApiClient();

  console.log(
    `Generating DAO contracts for network: ${network}, token: ${tokenSymbol}`
  );

  try {
    const result = await apiClient.generateDaoContracts(
      network,
      tokenSymbol,
      customReplacements
    );

    if (!result.contracts) {
      throw new Error(`Failed to generate DAO contracts`);
    }

    console.log(
      `Successfully generated ${result.contracts.length} DAO contracts`
    );
    return result;
  } catch (error) {
    console.error("Error generating DAO contracts:", error);
    throw error;
  }
}
