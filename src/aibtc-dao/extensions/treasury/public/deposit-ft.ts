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
import { TokenInfoService } from "../../../../api/token-info-service";
import { ContractCallError } from "../../../../api/contract-calls-client";

const usage =
  "Usage: bun run deposit-ft.ts <treasuryContract> <ftContract> <amount>";
const usageExample =
  "Example: bun run deposit-ft.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-treasury ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-token 1000";

interface ExpectedArgs {
  treasuryContract: string;
  ftContract: string;
  amount: number;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [treasuryContract, ftContract, amountStr] = process.argv.slice(2);
  const amount = parseInt(amountStr);
  if (!treasuryContract || !ftContract || !amount) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // verify contract addresses extracted from arguments
  const [treasuryAddress, treasuryName] = treasuryContract.split(".");
  const [ftAddress, ftName] = ftContract.split(".");
  if (!treasuryAddress || !treasuryName || !ftAddress || !ftName) {
    const errorMessage = [
      `Invalid contract addresses: ${treasuryContract} ${ftContract}`,
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
    treasuryContract,
    ftContract,
    amount,
  };
}

async function main() {
  // validate and store provided args
  const args = validateArgs();
  const [contractAddress, contractName] = args.treasuryContract.split(".");
  const [ftAddress, ftName] = args.ftContract.split(".");

  // setup network and wallet info
  const networkObj = getNetwork(CONFIG.NETWORK);
  const { address, key } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  const nextPossibleNonce = await getNextNonce(CONFIG.NETWORK, address);

  try {
    // Get asset name from contract ABI
    const tokenInfoService = new TokenInfoService(CONFIG.NETWORK);
    const assetName = await tokenInfoService.getAssetNameFromAbi(
      args.ftContract
    );

    if (!assetName) {
      throw new Error(
        `Could not determine asset name for token contract: ${args.ftContract}`
      );
    }

    console.log(`Asset name from ABI: ${assetName}`);

    // Set post-conditions using deconstructed values
    const postConditions = [
      Pc.principal(address)
        .willSendEq(args.amount)
        .ft(`${ftAddress}.${ftName}`, assetName),
    ];

    // prepare function arguments
    const functionArgs = [Cl.principal(args.ftContract), Cl.uint(args.amount)];
    // configure contract call options
    const txOptions: SignedContractCallOptions = {
      contractAddress,
      contractName,
      functionName: "deposit-ft",
      functionArgs,
      network: networkObj,
      nonce: nextPossibleNonce,
      senderKey: key,
      postConditionMode: PostConditionMode.Deny,
      postConditions,
    };
    // broadcast transaction and return response
    const transaction = await makeContractCall(txOptions);
    const broadcastResponse = await broadcastTx(transaction, networkObj);
    return broadcastResponse;
  } catch (error) {
    // Check if it's a ContractCallError
    if (error instanceof ContractCallError) {
      throw new Error(`Contract call failed: ${error.message} (${error.code})`);
    }
    throw error;
  }
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
