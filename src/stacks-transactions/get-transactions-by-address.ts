import {
  createErrorResponse,
  getApiUrl,
  getNetworkByPrincipal,
  sendToLLM,
  ToolResponse
} from "../utilities";

const usage = "Usage: bun run get-transactions-by-address.ts <address> [limit] [offset]";
const usageExample = "Example: bun run get-transactions-by-address.ts ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM 20 0";

interface ExpectedArgs {
  address: string;
  limit?: number;
  offset?: number;
}

interface TransactionResponse {
  limit: number;
  offset: number;
  total: number;
  results: Array<{
    tx: {
      tx_id: string;
      nonce: number;
      fee_rate: string;
      sender_address: string;
      sponsor_nonce: number;
      sponsored: boolean;
      sponsor_address: string;
      post_condition_mode: string;
      post_conditions: Array<{
        principal: {
          type_id: string;
        };
        condition_code: string;
        amount: string;
        type: string;
      }>;
      anchor_mode: string;
      block_hash: string;
      block_height: number;
      block_time: number;
      block_time_iso: string;
      burn_block_height: number;
      burn_block_time: number;
      burn_block_time_iso: string;
      parent_burn_block_time: number;
      parent_burn_block_time_iso: string;
      canonical: boolean;
      tx_index: number;
      tx_status: string;
      tx_result: {
        hex: string;
        repr: string;
      };
      event_count: number;
      parent_block_hash: string;
      is_unanchored: boolean;
      microblock_hash: string;
      microblock_sequence: number;
      microblock_canonical: boolean;
      execution_cost_read_count: number;
      execution_cost_read_length: number;
      execution_cost_runtime: number;
      execution_cost_write_count: number;
      execution_cost_write_length: number;
      events: Array<{
        event_index: number;
        event_type: string;
        tx_id: string;
        contract_log: {
          contract_id: string;
          topic: string;
          value: {
            hex: string;
            repr: string;
          };
        };
      }>;
      tx_type: string;
      contract_call: {
        contract_id: string;
        function_name: string;
      };
      smart_contract: {
        contract_id: string;
      };
      token_transfer: {
        recipient_address: string;
        amount: string;
        memo: string;
      };
    };
    stx_sent: string;
    stx_received: string;
    events: {
      stx: {
        transfer: number;
        mint: number;
        burn: number;
      };
      ft: {
        transfer: number;
        mint: number;
        burn: number;
      };
      nft: {
        transfer: number;
        mint: number;
        burn: number;
      };
    };
  }>;
}

function validateArgs(): ExpectedArgs {
  const [address, limitStr, offsetStr] = process.argv.slice(2);
  if (!address) {
    const errorMessage = [
      "No address provided",
      usage,
      usageExample
    ].join("\n");
    throw new Error(errorMessage);
  }
  
  const limit = limitStr ? Number(limitStr) : 20;
  const offset = offsetStr ? Number(offsetStr) : 0;
  
  return { address, limit, offset };
}

async function getTransactionsByAddress(
  address: string,
  limit: number = 20,
  offset: number = 0
): Promise<TransactionResponse> {
  const networkFromAddress = getNetworkByPrincipal(address);
  const apiUrl = getApiUrl(networkFromAddress);
  const response = await fetch(
    `${apiUrl}/extended/v2/addresses/${address}/transactions?limit=${limit}&offset=${offset}`,
    {
      headers: {
        Accept: "application/json",
      },
    }
  );
  if (!response.ok) {
    throw new Error(`Failed to get transactions: ${response.statusText}`);
  }
  const data = (await response.json()) as any;
  return data;
}

async function main(): Promise<ToolResponse<TransactionResponse>> {
  // validate and store provided args
  const args = validateArgs();
  
  // get transaction info from API
  const response = await getTransactionsByAddress(
    args.address, 
    args.limit || 20, 
    args.offset || 0
  );
  
  // Format the transactions for better readability in the response
  const formattedTransactions = response.results.map(result => ({
    status: result.tx.tx_status,
    senderAddress: result.tx.sender_address,
    blockTimeIso: result.tx.block_time_iso,
    type: result.tx.tx_type,
    contractInfo: result.tx.tx_type === "contract_call" 
      ? {
          contractId: result.tx.contract_call.contract_id,
          functionName: result.tx.contract_call.function_name
        } 
      : undefined,
    smartContractInfo: result.tx.tx_type === "smart_contract"
      ? {
          contractId: result.tx.smart_contract.contract_id
        }
      : undefined,
    tokenTransferInfo: result.tx.tx_type === "token_transfer"
      ? {
          recipientAddress: result.tx.token_transfer.recipient_address
        }
      : undefined,
    stxSent: result.stx_sent,
    stxReceived: result.stx_received
  }));
  
  return {
    success: true,
    message: `Retrieved ${response.results.length} transactions for address ${args.address}`,
    data: {
      ...response,
      formattedTransactions
    }
  };
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
