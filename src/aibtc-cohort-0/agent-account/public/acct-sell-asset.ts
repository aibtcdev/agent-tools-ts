import {
  AnchorMode,
  Cl,
  makeContractCall,
  Pc,
  PostConditionMode,
  SignedContractCallOptions,
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

const usage =
  "Usage: bun run acct-sell-asset.ts <agentAccountContract> <faktoryDexContract> <assetContract> <amount>";
const usageExample =
  "Example: bun run acct-sell-asset.ts ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-agent-account-test ST3DD7MASYJADCFXN3745R11RVM4PCXCPVRS3V27K.facey-faktory-dex ST3DD7MASYJADCFXN3745R11RVM4PCXCPVRS3V27K.facey-faktory 1000";

interface ExpectedArgs {
  agentAccountContract: string;
  faktoryDexContract: string;
  assetContract: string;
  amount: number;
}

function validateArgs(): ExpectedArgs {
  const [
    agentAccountContract,
    faktoryDexContract,
    assetContract,
    amountStr,
  ] = process.argv.slice(2);
  const amount = parseInt(amountStr);

  if (
    !agentAccountContract ||
    !faktoryDexContract ||
    !assetContract ||
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
  if (!isValidContractPrincipal(faktoryDexContract)) {
    const errorMessage = [
      `Invalid Faktory DEX contract address: ${faktoryDexContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  if (!isValidContractPrincipal(assetContract)) {
    const errorMessage = [
      `Invalid asset contract address: ${assetContract}`,
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
    faktoryDexContract,
    assetContract,
    amount,
  };
}

async function main() {
  const args = validateArgs();
  const [agentAccountContractAddress, agentAccountContractName] =
    args.agentAccountContract.split(".");
  const [assetContractAddress, assetContractName] =
    args.assetContract.split(".");

  const networkObj = getNetwork(CONFIG.NETWORK);
  const { address, key } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  const nextPossibleNonce = await getNextNonce(CONFIG.NETWORK, address);

  const tokenInfoService = new TokenInfoService(CONFIG.NETWORK);
  const assetName = await tokenInfoService.getAssetNameFromAbi(
    args.assetContract
  );
  if (!assetName) {
    throw new Error(
      `Could not determine asset name for token contract: ${args.assetContract}`
    );
  }

  const postConditions = [
    Pc.principal(args.agentAccountContract)
      .willSendEq(args.amount)
      .ft(`${assetContractAddress}.${assetContractName}`, assetName),
    // Note: Post-condition for receiving payment asset (e.g., STX) is omitted
    // because the exact amount received from the DEX is not known upfront.
  ];

  const functionArgs = [
    Cl.principal(args.faktoryDexContract),
    Cl.principal(args.assetContract),
    Cl.uint(args.amount),
  ];

  const txOptions: SignedContractCallOptions = {
    contractAddress: agentAccountContractAddress,
    contractName: agentAccountContractName,
    functionName: "acct-sell-asset",
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
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
