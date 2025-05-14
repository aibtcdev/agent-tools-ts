import { ContractApiClient } from "../api/client";
import { CONFIG, deriveChildAccount } from "../../utilities";

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

export async function deployDaoContracts(params: DeployDaoParams) {
  const {
    tokenSymbol,
    tokenName,
    tokenMaxSupply,
    tokenUri,
    logoUrl,
    originAddress,
    daoManifest,
    tweetOrigin,
    daoManifestInscriptionId,
    network = CONFIG.NETWORK,
  } = params;

  // Generate contracts using the API
  const apiClient = new ContractApiClient();
  const customReplacements = {
    token_symbol: tokenSymbol,
    token_name: tokenName,
    token_max_supply: tokenMaxSupply.toString(),
    token_uri: tokenUri,
    logo_url: logoUrl,
    origin_address: originAddress,
    dao_manifest: daoManifest,
    tweet_origin: tweetOrigin,
    dao_manifest_inscription_id: daoManifestInscriptionId || "",
  };

  // Generate all DAO contracts
  const generatedContracts = await apiClient.generateDaoContracts(
    network,
    tokenSymbol,
    customReplacements
  );

  // Here you would typically deploy these contracts
  // For now, we'll just return the generated contracts
  return generatedContracts;
}
