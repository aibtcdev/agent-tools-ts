import { Ordinalsbot } from "ordinalsbot";
import {
  CONFIG,
  createErrorResponse,
  sendToLLM,
  ToolResponse,
} from "../utilities";
import * as bitcoin from "bitcoinjs-lib";
import axios from "axios";
import * as ecc from "tiny-secp256k1";
import * as ecpair from "ecpair";

// Constants
const SUPPLY = 1000000000;
const standardFile = {
  name: "rune.txt",
  size: 1,
  type: "plain/text",
  dataURL: "data:plain/text;base64,YQ==",
};

const usage =
  "Usage: bun run src/btc-runes/etch-runes.ts <rune_name> <symbol> [network]";
const usageExample =
  'Example: bun run src/btc-runes/etch-runes.ts "FAKTORY•TOKEN" "K" testnet';

// Types
interface ExpectedArgs {
  runeName: string;
  runeSymbol: string;
  network: "testnet" | "mainnet";
}

interface UTXOInput {
  txid: string;
  vout: number;
  value: number;
  scriptPubKey: string;
}

function validateArgs(): ExpectedArgs {
  const [runeName, runeSymbol, network = "testnet"] = process.argv.slice(2);

  if (!runeName || !runeSymbol) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  // Better emoji support: use the spread operator to count visual characters
  if ([...runeSymbol].length !== 1) {
    throw new Error("Symbol must be a single character");
  }

  if (network !== "testnet" && network !== "mainnet") {
    throw new Error("Network must be either 'testnet' or 'mainnet'");
  }

  return {
    runeName,
    runeSymbol,
    network,
  };
}

async function makePayment(
  amount: number,
  paymentAddress: string,
  network: "testnet" | "mainnet"
): Promise<string> {
  const privateKey = process.env.BTC_PRIVATE_KEY_WIF;

  if (!privateKey) {
    throw new Error("BTC_PRIVATE_KEY_WIF environment variable is required");
  }

  // Initialize bitcoin network
  const btcNetwork =
    network === "testnet" ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;

  // Initialize ECC factory
  const ECPair = ecpair.ECPairFactory(ecc);

  const keyPair = ECPair.fromWIF(privateKey, btcNetwork);

  // Derive wallet address
  const { address } = bitcoin.payments.p2wpkh({
    pubkey: Buffer.from(keyPair.publicKey),
    network: btcNetwork,
  });

  if (!address) {
    throw new Error("Failed to derive wallet address");
  }

  // Get UTXOs from Blockstream API
  const apiEndpoint =
    network === "testnet"
      ? `https://blockstream.info/testnet/api/address/${address}/utxo`
      : `https://blockstream.info/api/address/${address}/utxo`;

  const response = await axios.get(apiEndpoint);
  const utxos = response.data;

  console.log(`Derived wallet address: ${address}`);

  if (!utxos.length) {
    throw new Error("No UTXOs found for the wallet address");
  }

  // Get transaction details for each UTXO
  const inputs: UTXOInput[] = await Promise.all(
    utxos.map(async (utxo: any) => {
      const txResponse = await axios.get(
        `${
          network === "testnet"
            ? "https://blockstream.info/testnet/api"
            : "https://blockstream.info/api"
        }/tx/${utxo.txid}/hex`
      );

      const tx = bitcoin.Transaction.fromHex(txResponse.data);
      return {
        txid: utxo.txid,
        vout: utxo.vout,
        value: utxo.value,
        scriptPubKey: bitcoin.address
          .toOutputScript(address, btcNetwork)
          .toString("hex"),
      };
    })
  );

  // Sort UTXOs by value (ascending)
  inputs.sort((a, b) => a.value - b.value);

  // Calculate total input value
  let totalInputValue = 0;
  let selectedInputs = [];

  for (const input of inputs) {
    selectedInputs.push(input);
    totalInputValue += input.value;

    if (totalInputValue >= amount + 1000) {
      // Add 1000 satoshis for transaction fee
      break;
    }
  }

  if (totalInputValue < amount + 1000) {
    throw new Error("Insufficient funds in the wallet");
  }

  // Create transaction
  const psbt = new bitcoin.Psbt({ network: btcNetwork });

  // Add inputs
  for (const input of selectedInputs) {
    psbt.addInput({
      hash: input.txid,
      index: input.vout,
      witnessUtxo: {
        script: Buffer.from(input.scriptPubKey, "hex"),
        value: input.value,
      },
    });
  }

  // Add payment output
  psbt.addOutput({
    address: paymentAddress,
    value: amount,
  });

  // Add change output if necessary
  const change = totalInputValue - amount - 1000; // Transaction fee: 1000 satoshis
  if (change > 0) {
    psbt.addOutput({
      address: address,
      value: change,
    });
  }

  // Sign inputs
  for (let i = 0; i < selectedInputs.length; i++) {
    psbt.signInput(i, {
      publicKey: Buffer.from(keyPair.publicKey),
      sign: (hash) => Buffer.from(keyPair.sign(hash)),
    });
  }

  // Finalize and extract transaction
  psbt.finalizeAllInputs();
  const tx = psbt.extractTransaction();
  const txHex = tx.toHex();

  // Broadcast transaction
  const broadcastEndpoint =
    network === "testnet"
      ? "https://blockstream.info/testnet/api/tx"
      : "https://blockstream.info/api/tx";

  const broadcastResponse = await axios.post(broadcastEndpoint, txHex);

  // Return transaction ID
  return tx.getId();
}

// async function main(): Promise<ToolResponse<string>> {
//   // Validate environment variables
//   const API_KEY = process.env.ORDINALSBOT_API_KEY;
//   const RECEIVE_ADDRESS = process.env.RECEIVE_ADDRESS;

//   if (!API_KEY) {
//     throw new Error("ORDINALSBOT_API_KEY environment variable is required");
//   }
//   if (!RECEIVE_ADDRESS) {
//     throw new Error("RECEIVE_ADDRESS environment variable is required");
//   }

//   // Validate and get arguments
//   const args = validateArgs();

//   try {
//     // Skip the library and make a direct API call with the correct payload format
//     const payload = {
//       rune: args.runeName,
//       supply: SUPPLY,
//       symbol: args.runeSymbol,
//       divisibility: 6,
//       premine: SUPPLY,
//       files: [
//         {
//           name: "rune.txt",
//           size: 1,
//           type: "plain/text",
//           dataURL: "data:plain/text;base64,YQ==",
//         },
//       ],
//       turbo: true,
//       fee: 1000,
//       receiveAddress: RECEIVE_ADDRESS,
//     };

//     console.log("Direct API payload:", {
//       ...payload,
//       receiveAddress: RECEIVE_ADDRESS,
//     });

//     // Use the correct endpoint from documentation
//     const endpoint = `https://api.ordinalsbot.com/runes/etch`;

//     try {
//       const response = await axios.post(endpoint, payload, {
//         headers: {
//           Authorization: `Bearer ${API_KEY}`,
//           "Content-Type": "application/json",
//         },
//       });

//       console.log("Direct API response:", response.data);

//       return {
//         success: true,
//         message: "Rune etch order created",
//         data: JSON.stringify(response.data),
//       };
//     } catch (axiosError) {
//       console.error("Direct API error details:");
//       if (axiosError.response) {
//         console.error("Status:", axiosError.response.status);
//         console.error(
//           "Data:",
//           JSON.stringify(axiosError.response.data, null, 2)
//         );
//         console.error(
//           "Headers:",
//           JSON.stringify(axiosError.response.headers, null, 2)
//         );
//       }
//       console.error("Request:", {
//         url: axiosError.config?.url,
//         method: axiosError.config?.method,
//         data: JSON.stringify(axiosError.config?.data, null, 2),
//       });
//       throw axiosError;
//     }
//   } catch (error) {
//     console.error("Full error:", error);
//     throw error;
//   }
// }

// Helper function to extract axios error from nested error objects
// function findAxiosError(error: any): any {
//   if (!error) return null;
//   if (axios.isAxiosError(error)) return error;

//   // Check common properties where an error might be nested
//   const nestedProps = [
//     "cause",
//     "original",
//     "source",
//     "error",
//     "err",
//     "inner",
//     "reason",
//   ];
//   for (const prop of nestedProps) {
//     if (error[prop] && typeof error[prop] === "object") {
//       const found = findAxiosError(error[prop]);
//       if (found) return found;
//     }
//   }

//   return null;
// }

async function main(): Promise<ToolResponse<string>> {
  // Validate environment variables
  const API_KEY = process.env.ORDINALSBOT_API_KEY;
  const RECEIVE_ADDRESS = process.env.RECEIVE_ADDRESS;

  if (!API_KEY) {
    throw new Error("ORDINALSBOT_API_KEY environment variable is required");
  }
  if (!RECEIVE_ADDRESS) {
    throw new Error("RECEIVE_ADDRESS environment variable is required");
  }

  // Validate and get arguments
  const args = validateArgs();

  try {
    // Initialize client
    const ordinalsbotObj = new Ordinalsbot(API_KEY, args.network);
    const inscription = ordinalsbotObj.Inscription();

    // Create order with more explicit parameters
    const runesEtchOrder = {
      files: [
        {
          name: "rune.txt",
          size: 1,
          type: "plain/text",
          dataURL: "data:plain/text;base64,YQ==",
        },
      ],
      turbo: true,
      rune: args.runeName,
      supply: SUPPLY,
      symbol: args.runeSymbol,
      divisibility: 6,
      premine: SUPPLY,
      fee: 2,
      receiveAddress: RECEIVE_ADDRESS,
    };

    const response = await inscription.createRunesEtchOrder(runesEtchOrder);
    console.log("API Response:", response);

    if (response && typeof response === "object" && "id" in response) {
      console.log(`Order created with ID: ${response.id}`);

      // Get order details to find required payment amount
      const orderDetails = await inscription.getOrder(response.id);

      if (orderDetails && orderDetails.fee) {
        console.log(`Order requires payment of ${orderDetails.fee} satoshis`);

        // Get payment address from charge object
        const paymentAddress = orderDetails.charge?.address;
        if (!paymentAddress) {
          throw new Error("No payment address found in order details");
        }
        console.log(`Payment will be sent to: ${paymentAddress}`);
        // Make the payment
        // Get the full payment amount from charge object
        const paymentAmount = orderDetails.charge?.amount;
        console.log(`Total payment amount: ${paymentAmount} satoshis`);
        const txId = await makePayment(
          paymentAmount,
          paymentAddress,
          args.network
        );

        console.log(`Payment made successfully with transaction ID: ${txId}`);

        // Wait for confirmation (you may want to implement a polling mechanism here)
        console.log("Waiting for confirmation...");

        // Check order status again
        const finalOrderStatus = await inscription.getOrder(response.id);

        return {
          success: true,
          message: "Rune etched and payment processed successfully",
          data: `Order ID: ${response.id}, Status: ${finalOrderStatus.status}, Payment TX: ${txId}`,
        };
      }

      const orderStatus = await inscription.getOrder(response.id);
      return {
        success: true,
        message: "Rune etched successfully",
        data: `Order ID: ${response.id}, Status: ${orderStatus.status}`,
      };
    }

    throw new Error("Failed to create rune order: No order ID returned");
  } catch (error) {
    console.error("Full error:", error);

    // You can also try to access the underlying error if it's wrapped

    throw error;
  }
}

// Execute with LLM response handling

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
