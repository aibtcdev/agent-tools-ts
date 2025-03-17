import {
  AnchorMode,
  Cl,
  makeContractCall,
  SignedContractCallOptions,
  PostConditionMode,
  Pc,
} from "@stacks/transactions";
import {
  broadcastTx,
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  getNetwork,
  getNextNonce,
  sendToLLM,
} from "../../../../utilities";

const usage = "Usage: bun run deposit-stx.ts <timedVaultContract> <amount>";
const usageExample =
  "Example: bun run deposit-stx.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtcdao-timed-vault 1000000";

interface ExpectedArgs {
  timedVaultContract: string;
  amount: number;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [timedVaultContract, amountStr] = process.argv.slice(2);
  const amount = parseInt(amountStr);
  if (!timedVaultContract || !amount) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // verify contract addresses extracted from arguments
  const [contractAddress, contractName] = timedVaultContract.split(".");
  if (!contractAddress || !contractName) {
    const errorMessage = [
      `Invalid contract address: ${timedVaultContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // verify amount is positive
  if (amount <= 0) {
    const errorMessage = [
      `Invalid amount: ${amount}. Amount must be positive.`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // return validated arguments
  return {
    timedVaultContract,
    amount,
  };
}

// deposits STX into the timed vault contract
async function main() {
  // validate and store provided args
  const args = validateArgs();
  const [contractAddress, contractName] = args.timedVaultContract.split(".");
  // setup network and wallet info
  const networkObj = getNetwork(CONFIG.NETWORK);
  const { address, key } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  const nextPossibleNonce = await getNextNonce(CONFIG.NETWORK, address);

  // Post-conditions to ensure exactly the specified amount of STX is transferred
  const postConditions = [Pc.principal(address).willSendEq(args.amount).ustx()];

  // configure contract call options
  const txOptions: SignedContractCallOptions = {
    anchorMode: AnchorMode.Any,
    contractAddress,
    contractName,
    functionName: "deposit-stx",
    functionArgs: [Cl.uint(args.amount)],
    network: networkObj,
    nonce: nextPossibleNonce,
    senderKey: key,
    postConditionMode: PostConditionMode.Deny, // Strictly enforce post-conditions
    postConditions,
  };
  // broadcast transaction and return response
  const transaction = await makeContractCall(txOptions);
  const broadcastResponse = await broadcastTx(transaction, networkObj);
  return broadcastResponse;
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
