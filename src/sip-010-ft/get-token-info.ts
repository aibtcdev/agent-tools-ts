import { CONFIG, getHiroTokenMetadata } from "../utilities";

async function getTokenInfo(contractAddress: string, contractName: string) {
  try {
    const contractId = `${contractAddress}.${contractName}`;
    const tokenInfo = await getHiroTokenMetadata(contractId);

    console.log(`name: ${tokenInfo.name}`);
    console.log(`asset_identifier: ${tokenInfo.asset_identifier}`);
    console.log(`symbol: ${tokenInfo.symbol}`);
    console.log(`decimals: ${tokenInfo.decimals}`);
    console.log(`supply: ${tokenInfo.total_supply}`);
    console.log(`description: ${tokenInfo.description}`);
    console.log(`image: ${tokenInfo.image_uri}`);
  } catch (error: any) {
    console.error(`Error fetching token info: ${error.message}`);
  }
}

const [contractAddress, contractName] = process.argv[2]?.split(".") || [];

if (contractAddress && contractName) {
  getTokenInfo(contractAddress, contractName);
} else {
  console.error("Please provide a contract address.name");
}
