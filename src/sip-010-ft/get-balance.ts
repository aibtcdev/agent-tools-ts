import {
  callReadOnlyFunction,
  cvToJSON,
  standardPrincipalCV,
} from "@stacks/transactions";
import { CONFIG, getNetwork, deriveChildAccount } from "../utilities";

async function getBalance(
  contractAddress: string,
  contractName: string,
  address: string
) {
  const network = getNetwork(CONFIG.NETWORK);
  const { address: senderAddress } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );

  try {
    const result = await callReadOnlyFunction({
      contractAddress,
      contractName,
      functionName: "get-balance",
      functionArgs: [standardPrincipalCV(address)],
      senderAddress,
      network,
    });

    const jsonResult = cvToJSON(result);

    if (jsonResult.value && jsonResult.value.value) {
      console.log(`balance: ${jsonResult.value.value}`);
    } else {
      console.log("balance: 0");
    }
  } catch (error: any) {
    console.error(`Error fetching balance: ${error.message}`);
  }
}

const [contractAddress, contractName] = process.argv[2]?.split(".") || [];
const address = process.argv[3];

if (contractAddress && contractName && address) {
  getBalance(contractAddress, contractName, address);
} else {
  console.error("Please provide a contract address.name and an address");
}
