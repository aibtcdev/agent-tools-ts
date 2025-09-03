import {
  Cl,
  makeContractCall,
  SignedContractCallOptions,
  PostConditionMode,
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

const usage =
  "Usage: bun run set-asset.ts <daoRunCostContract> <nonce> <token> <enabled>";
const usageExample =
  "Example: bun run set-asset.ts ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtc-dao-run-cost 1 ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5 true";

interface ExpectedArgs {
  daoRunCostContract: string;
  nonce: number;
  token: string;
  enabled: boolean;
}

function validateArgs(): ExpectedArgs {
  const [daoRunCostContract, nonceStr, token, enabledStr] = process.argv.slice(2);
  const nonce = parseInt(nonceStr);
  const enabled = enabledStr.toLowerCase() === "true";

  if (!daoRunCostContract || isNaN(nonce) || !token || enabledStr === undefined) {
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

  if (!isValidContractPrincipal(token)) {
    const errorMessage = [
      `Invalid token principal: ${token}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }

  return { daoRunCostContract, nonce, token, enabled };
}

async function main() {
  const args = validateArgs();
  const [contractAddress, contractName] = args.daoRunCostContract.split(".");

  const networkObj = getNetwork(CONFIG.NETWORK);
  const { address, key } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  const nextPossibleNonce = await getNextNonce(CONFIG.NETWORK, address);

  const functionArgs = [
    Cl.uint(args.nonce),
    Cl.principal(args.token),
    Cl.bool(args.enabled),
  ];

  const txOptions: SignedContractCallOptions = {
    contractAddress,
    contractName,
    functionName: "set-asset",
    functionArgs,
    network: networkObj,
    nonce: nextPossibleNonce,
    senderKey: key,
    postConditionMode: PostConditionMode.Deny,
    postConditions: [],
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
