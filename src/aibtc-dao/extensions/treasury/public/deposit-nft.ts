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
  sendToLLM,
} from "../../../../utilities";

const usage =
  "Usage: bun run deposit-nft.ts <treasuryContract> <nftContract> <nftAssetId> <tokenId>";
const usageExample =
  "Example: bun run deposit-nft.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-treasury ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtcdev-airdrop-1 aibtcdev-1 1";

interface ExpectedArgs {
  treasuryContract: string;
  nftContract: string;
  nftAssetName: string;
  tokenId: number;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [treasuryContract, nftContract, nftAssetName, tokenIdStr] =
    process.argv.slice(2);
  const tokenId = parseInt(tokenIdStr);
  if (!treasuryContract || !nftContract || !tokenId) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // verify contract addresses extracted from arguments
  const [treasuryAddress, treasuryName] = treasuryContract.split(".");
  const [nftContractAddress, nftContractName] = nftContract.split(".");
  if (
    !treasuryAddress ||
    !treasuryName ||
    !nftContractAddress ||
    !nftContractName
  ) {
    const errorMessage = [
      `Invalid contract addresses: ${treasuryContract} ${nftContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // verify tokenId is positive
  if (tokenId <= 0) {
    const errorMessage = [
      `Invalid tokenId: ${tokenId}. TokenId must be positive.`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // return validated arguments
  return {
    treasuryContract,
    nftContract,
    nftAssetName,
    tokenId,
  };
}

async function main() {
  // validate and store provided args
  const args = validateArgs();
  const [contractAddress, contractName] = args.treasuryContract.split(".");
  const [nftContractAddress, nftContractName] = args.nftContract.split(".");
  // setup network and wallet info
  const networkObj = getNetwork(CONFIG.NETWORK);
  const { address, key } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  const nextPossibleNonce = await getNextNonce(CONFIG.NETWORK, address);
  // set post-conditions
  const postConditions = [
    Pc.principal(address)
      .willSendAsset()
      .nft(
        `${nftContractAddress}.${nftContractName}::${args.nftAssetName}`,
        Cl.uint(args.tokenId)
      ),
  ];
  // prepare function arguments
  const functionArgs = [Cl.principal(args.nftContract), Cl.uint(args.tokenId)];
  // configure contract call options
  const txOptions: SignedContractCallOptions = {
    contractAddress,
    contractName,
    functionName: "deposit-nft",
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
}

main()
  .then(sendToLLM)
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
