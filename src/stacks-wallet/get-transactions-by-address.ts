// CONFIGURATION

import { CONFIG, getTransactionsByAddress } from "../utilities";

// MAIN SCRIPT (DO NOT EDIT)

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
    const response = await getTransactionsByAddress(
      CONFIG.NETWORK,
      address,
      limit,
      offset
    );
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
