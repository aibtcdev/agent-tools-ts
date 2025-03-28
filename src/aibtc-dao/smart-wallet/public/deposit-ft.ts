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
  getAssetNameFromIdentifier,
  getHiroTokenMetadata,
  getNetwork,
  getNextNonce,
  sendToLLM,
} from "../../../utilities";
import { getSIP010Info } from "../../../cache-utils";
import { ContractCallError } from "../../../api/contract-calls-client";
import { TokenInfoService } from "../../../api/token-info-service";

const usage =
  "Usage: bun run deposit-ft.ts <smartWalletContract> <ftContract> <amount>";
const usageExample =
  "Example: bun run deposit-ft.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-user-agent-smart-wallet ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-token 1000";

interface ExpectedArgs {
  smartWalletContract: string;
  ftContract: string;
  amount: number;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [smartWalletContract, ftContract, amountStr] = process.argv.slice(2);
  const amount = parseInt(amountStr);
  if (!smartWalletContract || !ftContract || !amount) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // verify contract addresses extracted from arguments
  const [walletAddress, walletName] = smartWalletContract.split(".");
  const [ftAddress, ftName] = ftContract.split(".");
  if (!walletAddress || !walletName || !ftAddress || !ftName) {
    const errorMessage = [
      `Invalid contract addresses: ${smartWalletContract} ${ftContract}`,
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
    smartWalletContract,
    ftContract,
    amount,
  };
}

async function main() {
  // validate and store provided args
  const args = validateArgs();
  const [contractAddress, contractName] = args.smartWalletContract.split(".");
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
    // Try to get asset name from contract ABI first
    const tokenInfoService = new TokenInfoService(CONFIG.NETWORK);
    let assetName: string | undefined;
    
    try {
      // First try to get the asset name from the contract ABI
      assetName = await tokenInfoService.getAssetNameFromAbi(args.ftContract);
      console.log(`Asset name from ABI: ${assetName}`);
    } catch (error) {
      console.log(`Could not get asset name from ABI: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // If we couldn't get the asset name from the ABI, fall back to the Hiro API
    if (!assetName) {
      const tokenMetadata = await getHiroTokenMetadata(args.ftContract);
      console.log(`tokenMetadata`, tokenMetadata);
      assetName = getAssetNameFromIdentifier(tokenMetadata.asset_identifier);
    }

    // Add post-conditions to ensure sender sends exact amount of FT
    const postConditions = [
      Pc.principal(address)
        .willSendEq(args.amount)
        .ft(`${ftAddress}.${ftName}`, assetName),
    ];

    // prepare function arguments
    const functionArgs = [Cl.principal(args.ftContract), Cl.uint(args.amount)];

    // configure contract call options
    const txOptions: SignedContractCallOptions = {
      anchorMode: AnchorMode.Any,
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
