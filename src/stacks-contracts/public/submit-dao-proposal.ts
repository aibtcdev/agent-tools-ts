import {
  AnchorMode,
  makeContractCall,
  PostConditionMode,
  principalCV,
  SignedContractCallOptions,
  stringAsciiCV,
  uintCV,
} from "@stacks/transactions";
import {
  broadcastTx,
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  getNetwork,
  getNextNonce,
  isValidContractPrincipal,
  sendToLLM,
} from "../../utilities";

const usage =
  "Usage: bun run submit-dao-proposal.ts <daoGovernanceContract> <text> <amount> <recipient>";
const usageExample =
  'Example: bun run submit-dao-proposal.ts ST2V0YVFX1AD1JHFKVPPR1EDBRQ1K9BWN2VTH42VE.dao-governance "Add a new feature" 5000 ST2V0YVFX1AD1JHFKVPPR1EDBRQ1K9BWN2VTH42VE';

interface ExpectedArgs {
  daoGovernanceContract: string;
  text: string;
  amount: number;
  recipient: string;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [daoGovernanceContract, text, amountStr, recipient] =
    process.argv.slice(2);

  if (!daoGovernanceContract || !text || !amountStr || !recipient) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  const amount = parseInt(amountStr);
  if (isNaN(amount) || amount <= 0) {
    const errorMessage = [
      `Invalid amount: ${amountStr}. Must be a positive number.`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  // verify contract addresses
  if (!isValidContractPrincipal(daoGovernanceContract)) {
    const errorMessage = [
      `Invalid contract address: ${daoGovernanceContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  // return validated arguments
  return {
    daoGovernanceContract,
    text,
    amount,
    recipient,
  };
}

// Submits a proposal to the DAO governance contract
async function main() {
  // validate and store provided args
  const args = validateArgs();
  const [contractAddress, contractName] = args.daoGovernanceContract.split(".");

  // setup network and wallet info
  const networkObj = getNetwork(CONFIG.NETWORK);
  const { address, key } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );

  const nextPossibleNonce = await getNextNonce(CONFIG.NETWORK, address);

  // configure contract call options
  const txOptions: SignedContractCallOptions = {
    contractAddress,
    contractName,
    functionName: "submit-proposal",
    functionArgs: [
      stringAsciiCV(args.text),
      uintCV(args.amount),
      principalCV(args.recipient),
    ],
    network: networkObj,
    nonce: nextPossibleNonce,
    senderKey: key,
    postConditionMode: PostConditionMode.Allow,
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
