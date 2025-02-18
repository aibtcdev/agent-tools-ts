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
const SUPPLY = 1_000_000_000;
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

  if (runeSymbol.length !== 1) {
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
  network: "testnet" | "mainnet"
): Promise<string> {
  const privateKey = process.env.BTC_PRIVATE_KEY;
  console.log("BTC privateKey prefix:", privateKey?.slice(0, 6), "...");
  console.log("BTC privateKey length:", privateKey?.length);

  const receiveAddress = process.env.RECEIVE_ADDRESS;
  console.log(
    "receiveAddress rafa prefix:",
    receiveAddress?.slice(0, 10),
    "..."
  );
  console.log("BTC receiveAddress length:", receiveAddress?.length);

  if (!privateKey) {
    throw new Error("BTC_PRIVATE_KEY environment variable is required");
  }
  if (!receiveAddress) {
    throw new Error("RECEIVE_ADDRESS environment variable is required");
  }

  // Initialize bitcoin network
  const btcNetwork =
    network === "testnet" ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;

  // Initialize ECC factory
  const ECPair = ecpair.ECPairFactory(ecc);

  // Create key pair from private key
  const keyPair = ECPair.fromPrivateKey(Buffer.from(privateKey, "hex"), {
    network: btcNetwork,
  });

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
    address: receiveAddress,
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
      fee: 510,
      receiveAddress: RECEIVE_ADDRESS,
    };

    console.log("Attempting to create rune order with:", {
      ...runesEtchOrder,
      receiveAddress: "[HIDDEN]", // Hide sensitive data in logs
    });

    const response = await inscription.createRunesEtchOrder(runesEtchOrder);
    console.log("API Response:", response);

    if (response && typeof response === "object" && "id" in response) {
      console.log(`Order created with ID: ${response.id}`);

      // Get order details to find required payment amount
      const orderDetails = await inscription.getOrder(response.id);

      if (orderDetails && orderDetails.fee) {
        console.log(`Order requires payment of ${orderDetails.fee} satoshis`);

        // Make the payment
        const txId = await makePayment(orderDetails.fee, args.network);
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
    // Enhanced error logging for axios errors
    if (error.isAxiosError) {
      console.error("API Error Details:");
      console.error("Status:", error.response?.status);
      console.error("Status Text:", error.response?.statusText);
      console.error(
        "Response Data:",
        JSON.stringify(error.response?.data, null, 2)
      );
      console.error(
        "Response Headers:",
        JSON.stringify(error.response?.headers, null, 2)
      );
      console.error("Request URL:", error.config?.url);
      console.error("Request Method:", error.config?.method);
      console.error(
        "Request Data:",
        JSON.stringify(error.config?.data, null, 2)
      );
      console.error(
        "Request Headers:",
        JSON.stringify(error.config?.headers, null, 2)
      );
    }

    // You can also try to access the underlying error if it's wrapped
    if (error.cause) {
      console.error("Underlying error:", error.cause);
    }
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
