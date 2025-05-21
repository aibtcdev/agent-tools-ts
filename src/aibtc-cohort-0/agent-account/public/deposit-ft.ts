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
  isValidContractPrincipal,
  sendToLLM,
  TokenInfoService,
} from "../../../../utilities";
import { ContractCallError } from "../../../../api/contract-calls-client";

const usage =
  "Usage: bun run deposit-ft.ts <agentAccountContract> <ftContract> <amount>";
const usageExample =
  "Example: bun run deposit-ft.ts ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-agent-account-test ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-token 1000";

interface ExpectedArgs {
  agentAccountContract: string;
  ftContract: string;
  amount: number;
}

function validateArgs(): ExpectedArgs {
  const [agentAccountContract, ftContract, amountStr] = process.argv.slice(2);
  const amount = parseInt(amountStr);
  if (
    !agentAccountContract ||
    !ftContract ||
    !amountStr ||
    isNaN(amount)
  ) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  if (!isValidContractPrincipal(agentAccountContract)) {
    const errorMessage = [
      `Invalid agent account contract address: ${agentAccountContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  if (!isValidContractPrincipal(ftContract)) {
    const errorMessage = [
      `Invalid FT contract address: ${ftContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  if (amount <= 0) {
    const errorMessage = [
      `Invalid amount: ${amount}. Amount must be positive.`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  return {
    agentAccountContract,
    ftContract,
    amount,
  };
}

async function main() {
  const args = validateArgs();
  const [contractAddress, contractName] = args.agentAccountContract.split(
    "."
  );
  const [ftAddress, ftName] = args.ftContract.split(".");

  const networkObj = getNetwork(CONFIG.NETWORK);
  const { address, key } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  const nextPossibleNonce = await getNextNonce(CONFIG.NETWORK, address);

  try {
    const tokenInfoService = new TokenInfoService(CONFIG.NETWORK);
    const assetName = await tokenInfoService.getAssetNameFromAbi(
      args.ftContract
    );

    if (!assetName) {
      throw new Error(
        `Could not determine asset name for token contract: ${args.ftContract}`
      );
    }

    const postConditions = [
      Pc.principal(address) // The sender (user running the script)
        .willSendEq(args.amount)
        .ft(`${ftAddress}.${ftName}`, assetName), // To the agent account
    ];

    const functionArgs = [Cl.principal(args.ftContract), Cl.uint(args.amount)];

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
      anchorMode: AnchorMode.Any,
    };

    const transaction = await makeContractCall(txOptions);
    const broadcastResponse = await broadcastTx(transaction, networkObj);
    return broadcastResponse;
  } catch (error) {
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
