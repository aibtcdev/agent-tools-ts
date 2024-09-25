// CONFIGURATION

import { getApiUrl, getNetworkByPrincipal } from "../utilities";

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

async function main() {
  // expect txId as first argument
  const address = process.argv[2];
  const limit = Number(process.argv[3]) || 20;
  const offset = Number(process.argv[4]) || 0;

  if (!address) {
    console.error("No address provided, exiting...");
    return;
  }

  // get transaction info from API
  try {
    const response = await getTransactionsByAddress(address, limit, offset);
    // for x in response
    for (let i = 0; i < response.results.length; i++) {
      console.log("START TRANSACTION");
      console.log("Status: ", response.results[i].tx.tx_status);
      console.log("Sender Address: " + response.results[i].tx.sender_address);
      console.log("Block Time ISO: " + response.results[i].tx.block_time_iso);
      console.log("Type: ", response.results[i].tx.tx_type);
      if (response.results[i].tx.tx_type == "contract_call") {
        console.log(
          "Contract Name: ",
          response.results[i].tx.contract_call.contract_id
        );
        console.log(
          "Function Name: ",
          response.results[i].tx.contract_call.function_name
        );
      }
      if (response.results[i].tx.tx_type == "smart_contract") {
        console.log(
          "Contract Name: ",
          response.results[i].tx.smart_contract.contract_id
        );
      }
      if (response.results[i].tx.tx_type == "token_transfer") {
        console.log(
          "Recipient Address: ",
          response.results[i].tx.token_transfer.recipient_address
        );
      }
      console.log("MicroSTX Sent: ", response.results[i].stx_sent);
      console.log("MicroSTX Received: ", response.results[i].stx_received);
      console.log("END TRANSACTION");
    }
    // console.log(JSON.stringify(response, null, 2));
  } catch (error) {
    // report error
    console.error(`General/Unexpected Failure: ${error}`);
  }
}

main();
