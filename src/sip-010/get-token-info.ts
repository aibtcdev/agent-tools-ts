import { callReadOnlyFunction, cvToJSON } from "@stacks/transactions";
import { getNetwork, CONFIG, deriveChildAccount } from "../utilities";

async function getTokenInfo(contractAddress, contractName) {
  const network = getNetwork(CONFIG.NETWORK);
  const { address } = await deriveChildAccount(CONFIG.NETWORK, CONFIG.MNEMONIC, CONFIG.ACCOUNT_INDEX);

  const functions = ['get-name', 'get-symbol', 'get-decimals', 'get-total-supply'];
  const tokenInfo = {};

  for (const func of functions) {
    try {
      const result = await callReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: func,
        functionArgs: [],
        senderAddress: address,
        network,
      });

      const jsonResult = cvToJSON(result);
      const key = func.replace('get-', '');
      tokenInfo[key] = key === 'decimals' || key === 'total-supply' 
        ? parseInt(jsonResult.value.value) 
        : jsonResult.value.value;
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error fetching ${func}: ${error.message}`);
      } else {
        console.error(`An unknown error occurred while fetching ${func}`);
      }
    }
  }

  console.log(`name: ${tokenInfo.name}`);
  console.log(`symbol: ${tokenInfo.symbol}`);
  console.log(`decimals: ${tokenInfo.decimals}`);
  console.log(`total supply: ${tokenInfo['total-supply'].toLocaleString()}`);
}

const [contractAddress, contractName] = process.argv.slice(2);

if (contractAddress && contractName) {
  getTokenInfo(contractAddress, contractName);
} else {
  console.error("Please provide a contract address and contract name");
  console.error("Usage: <contractAddress> <contractName>");
}
