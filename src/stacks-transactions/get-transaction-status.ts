import { Transaction } from "@stacks/stacks-blockchain-api-types";
import {
  CONFIG,
  createErrorResponse,
  getApiUrl,
  sendToLLM,
  ToolResponse
} from "../utilities";

const usage = "Usage: bun run get-transaction-status.ts <txId>";
const usageExample = "Example: bun run get-transaction-status.ts 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

interface ExpectedArgs {
  txId: string;
}

function validateArgs(): ExpectedArgs {
  const [txId] = process.argv.slice(2);
  if (!txId) {
    const errorMessage = [
      "No transaction ID provided",
      usage,
      usageExample
    ].join("\n");
    throw new Error(errorMessage);
  }
  return { txId };
}

// gets transaction data from the API
async function getTransaction(network: string, txId: string): Promise<Transaction> {
  const apiUrl = getApiUrl(network);
  const response = await fetch(`${apiUrl}/extended/v1/tx/${txId}`);
  if (!response.ok) {
    throw new Error(`Failed to get transaction: ${response.statusText}`);
  }
  const data = await response.json();
  return data as Transaction;
}

async function main(): Promise<ToolResponse<{ txStatus: string }>> {
  // validate and store provided args
  const args = validateArgs();
  
  // get transaction info from API
  const txResponse = await getTransaction(CONFIG.NETWORK, args.txId);
  
  // get transaction status from object
  const txStatus = txResponse.tx_status;
  
  return {
    success: true,
    message: `Transaction status retrieved successfully`,
    data: { txStatus }
  };
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
