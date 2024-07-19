import { CONFIG } from "../utilities";
import { StacksMainnet, StacksTestnet } from "@stacks/network";
import { callReadOnlyFunction, cvToValue, standardPrincipalCV, ClarityType } from "@stacks/transactions";

async function getSTXBalance(address: string) {
  const network = CONFIG.NETWORK === "mainnet" ? new StacksMainnet() : new StacksTestnet();
  
  const contractAddress = 'SP000000000000000000002Q6VF78';
  const contractName = 'pox-3';
  const functionName = 'get-stx-balance';

  try {
    const result = await callReadOnlyFunction({
      network,
      contractAddress,
      contractName,
      functionName,
      functionArgs: [standardPrincipalCV(address)],
      senderAddress: address,
    });

    if (result.type !== ClarityType.ResponseOk) {
      throw new Error('Failed to get STX balance');
    }

    const balanceCV = result.value;
    if (balanceCV.type !== ClarityType.UInt) {
      throw new Error('Unexpected balance type');
    }

    const balance = cvToValue(balanceCV);

    return {
      unlocked: balance.toString(),
      locked: "0", // Note: This method doesn't provide locked balance information
      total: balance.toString()
    };
  } catch (error) {
    console.error(`Failed to get STX balance: ${error}`);
    throw error;
  }
}

async function main() {
  const address = process.argv[2];
  if (!address) {
    console.error("No address provided. Usage: bun run get-stx-balance.ts <address>");
    process.exit(1);
  }

  try {
    const balance = await getSTXBalance(address);
    console.log(JSON.stringify(balance, null, 2));
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

main();