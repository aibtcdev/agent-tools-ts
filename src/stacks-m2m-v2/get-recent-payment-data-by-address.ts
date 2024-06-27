import {
  ReadOnlyFunctionOptions,
  callReadOnlyFunction,
  cvToJSON,
  Cl,
} from "@stacks/transactions";
import { CONTRACT_NAME, DEPLOYER } from "../constants";
import { CONFIG, deriveChildAccount } from "../utilities";
import { InvoiceData } from "../types";

// get recent payment data in contract
// param: address

// CONFIGURATION

const FUNCTION_NAME = "get-recent-payment-data-by-address";
const RESOURCE_NAME = "bitcoin-face";

// MAIN SCRIPT (DO NOT EDIT)

async function main() {
  // get account info
  const network = CONFIG.NETWORK;
  const mnemonic = CONFIG.MNEMONIC;
  const accountIndex = CONFIG.ACCOUNT_INDEX;

  // get address from mnemonic
  const { address: senderAddress } = await deriveChildAccount(
    network,
    mnemonic,
    accountIndex
  );

  // expect address as first argument
  // or default to configured wallet
  let address = process.argv[2];
  if (!address) {
    address = senderAddress;
  }
  const FUNCTION_ARGS = [Cl.stringUtf8(RESOURCE_NAME), Cl.principal(address)];

  const txOptions: ReadOnlyFunctionOptions = {
    contractName: CONTRACT_NAME,
    contractAddress: DEPLOYER,
    functionName: FUNCTION_NAME,
    functionArgs: FUNCTION_ARGS,
    network: network,
    senderAddress: senderAddress,
  };

  try {
    const response = await callReadOnlyFunction(txOptions);
    const responseJson = cvToJSON(response);
    /*
    example response:
    {
      type: "(optional (tuple (amount uint) (createdAt uint) (resourceIndex uint) (resourceName (string-utf8 12)) (userIndex uint)))",
      value: {
        type: "(tuple (amount uint) (createdAt uint) (resourceIndex uint) (resourceName (string-utf8 12)) (userIndex uint))",
        value: {
          amount: [Object ...],
          createdAt: [Object ...],
          resourceIndex: [Object ...],
          resourceName: [Object ...],
          userIndex: [Object ...],
        },
      },
    }
    */
    const invoice = responseJson.value.value;
    /*
    example invoice data:
    {
      amount: {
        type: "uint",
        value: "1000",
      },
      createdAt: {
        type: "uint",
        value: "148831",
      },
      resourceIndex: {
        type: "uint",
        value: "1",
      },
      resourceName: {
        type: "(string-utf8 12)",
        value: "bitcoin-face",
      },
      userIndex: {
        type: "uint",
        value: "3",
      },
    }
    */
    const invoiceData: InvoiceData = {
      amount: parseInt(invoice.amount.value),
      createdAt: parseInt(invoice.createdAt.value),
      resourceIndex: parseInt(invoice.resourceIndex.value),
      resourceName: invoice.resourceName.value,
      userIndex: parseInt(invoice.userIndex.value),
    };
    console.log(invoiceData);
  } catch (error) {
    // report error
    console.error(`General/Unexpected Failure: ${error}`);
  }
}

main();
