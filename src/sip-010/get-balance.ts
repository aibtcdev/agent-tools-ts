import { callReadOnlyFunction, cvToJSON, standardPrincipalCV } from "@stacks/transactions";
import { getNetwork, CONFIG, deriveChildAccount } from "../utilities";

async function getBalance(contractAddress: string, contractName: string, address: string) {
  const network = getNetwork(CONFIG.NETWORK);
  const { address: senderAddress } = await deriveChildAccount(CONFIG.NETWORK, CONFIG.MNEMONIC, CONFIG.ACCOUNT_INDEX);

  try {
    const result = await callReadOnlyFunction({
      contractAddress,
      contractName,
      functionName: 'get-balance',
      functionArgs: [standardPrincipalCV(address)],
      senderAddress,
      network,
    });

    const jsonResult = cvToJSON(result);

    if (jsonResult.value && jsonResult.value.value !== undefined) {
      console.log(`Balance: ${jsonResult.value.value}`);
    } else {
      console.log('Balance: 0');
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Error fetching balance: ${error.message}`);
    } else {
      console.error('An unknown error occurred while fetching balance');
    }
  }
}

const [contractAddress, contractName, address] = process.argv.slice(2);

if (contractAddress && contractName && address) {
  getBalance(contractAddress, contractName, address);
} else {
  console.error("Please provide a contract address, contract name, address.");
  console.error("Usage: <contractAddress> <contractName> <address>");
}
