import {
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
} from "../../../utilities";
import { TokenInfoService } from "../../../api/token-info-service";
import { ContractCallError } from "../../../api/contract-calls-client";

const usage =
  "Usage: bun run transfer-token.ts <daoRunCostContract> <nonce> <ftContract> <amount> <to>";
const usageExample =
  "Example: bun run transfer-token.ts ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-run-cost 1 ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5.aibtc-token 1000 ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG";

interface ExpectedArgs {
  daoRunCostContract: string;
  nonce: number;
  ftContract: string;
  amount: number;
  to: string;
}

function validateArgs(): ExpectedArgs {
  const [daoRunCostContract, nonceStr, ftContract, amountStr, to] = process.argv.slice(2);
  const nonce = parseInt(nonceStr);
  const amount = parseInt(amountStr);

  if (!daoRunCostContract || isNaN(nonce) || !ftContract || isNaN(amount) || !to) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  if (!isValidContractPrincipal(daoRunCostContract)) {
    const errorMessage = [
      `Invalid DAO run cost contract address: ${daoRunCostContract}`,
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

  if (!isValidContractPrincipal(to)) {
    const errorMessage = [
      `Invalid recipient principal: ${to}`,
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

  return { daoRunCostContract, nonce, ftContract, amount, to };
}

async function main() {
  const args = validateArgs();
  const [contractAddress, contractName] = args.daoRunCostContract.split(".");
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
        .ft(`${ftAddress}.${ftName}`, assetName), // To the recipient
    ];

    const functionArgs = [
      Cl.uint(args.nonce),
      Cl.contractPrincipal(ftAddress, ftName), // Trait reference
      Cl.uint(args.amount),
      Cl.principal(args.to),
    ];

    const txOptions: SignedContractCallOptions = {
      contractAddress,
      contractName,
      functionName: "transfer-token",
      functionArgs,
      network: networkObj,
      nonce: nextPossibleNonce,
      senderKey: key,
      postConditionMode: PostConditionMode.Deny,
      postConditions,
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
