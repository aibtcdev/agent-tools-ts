import { callReadOnlyFunction, cvToJSON } from "@stacks/transactions";
import { CONFIG, getNetwork, deriveChildAccount } from "../utilities";

async function getTokenInfo(contractAddress: string, contractName: string) {
  const network = getNetwork(CONFIG.NETWORK);
  const { address } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );

  const functions = [
    "get-name",
    "get-symbol",
    "get-decimals",
    "get-total-supply",
  ];
  const tokenInfo: { [key: string]: string | number } = {};

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
      const key = func.replace("get-", "");
      tokenInfo[key] =
        key === "decimals" || key === "total-supply"
          ? parseInt(jsonResult.value.value)
          : jsonResult.value.value;
    } catch (error: any) {
      console.error(`Error fetching ${func}: ${error.message}`);
    }
  }

  console.log(`name: ${tokenInfo.name}`);
  console.log(`symbol: ${tokenInfo.symbol}`);
  console.log(`decimals: ${tokenInfo.decimals}`);
  console.log(`supply: ${tokenInfo["total-supply"].toLocaleString()}`);
}

const [contractAddress, contractName] = process.argv[2]?.split(".") || [];

if (contractAddress && contractName) {
  getTokenInfo(contractAddress, contractName);
} else {
  console.error("Please provide a contract address.name");
}
