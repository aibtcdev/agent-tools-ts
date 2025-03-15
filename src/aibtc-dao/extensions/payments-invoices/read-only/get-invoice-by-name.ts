import { Cl, cvToValue, callReadOnlyFunction } from "@stacks/transactions";
import { getNetwork, CONFIG } from "../../../../utilities";

interface InvoiceDetails {
  amount: number;
  createdAt: number;
  resourceName: string;
  resourceIndex: number;
  userIndex: number;
}

export async function getInvoiceByName(
  contractAddress: string,
  contractName: string,
  resourceName: string
): Promise<InvoiceDetails | null> {
  const networkObj = getNetwork(CONFIG.NETWORK);
  const functionArgs = [Cl.stringUtf8(resourceName)];
  
  const result = await callReadOnlyFunction({
    contractAddress,
    contractName,
    functionName: "get-resource-index",
    functionArgs,
    network: networkObj,
    senderAddress: contractAddress,
  });

  if (!result) {
    return null;
  }

  const resourceIndex = Number(cvToValue(result));
  
  // Now get the invoice data using the resource index
  const invoiceResult = await callReadOnlyFunction({
    contractAddress,
    contractName,
    functionName: "get-invoice",
    functionArgs: [Cl.uint(resourceIndex)],
    network: networkObj,
    senderAddress: contractAddress,
  });

  if (!invoiceResult) {
    return null;
  }

  const value = cvToValue(invoiceResult);
  
  return {
    amount: Number(value.amount),
    createdAt: Number(value.createdAt),
    resourceName: value.resourceName,
    resourceIndex: Number(value.resourceIndex),
    userIndex: Number(value.userIndex)
  };
} 