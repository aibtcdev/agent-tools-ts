import {
  AnchorMode,
  Cl,
  makeContractCall,
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
  "Usage: bun run deposit-nft.ts <treasuryContract> <nftContract> <tokenId>";
const usageExample =
  "Example: bun run deposit-nft.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtcdao-treasury ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.token-nft 1";

interface ExpectedArgs {
  treasuryContract: string;
  nftContract: string;
  tokenId: number;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [treasuryContract, nftContract, tokenIdStr] = process.argv.slice(2);
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
  const [nftAddress, nftName] = nftContract.split(".");
  if (!treasuryAddress || !treasuryName || !nftAddress || !nftName) {
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
    tokenId,
  };
}

async function main() {
  // validate and store provided args
  const args = validateArgs();
  const [contractAddress, contractName] = args.treasuryContract.split(".");
  // setup network and wallet info
  const networkObj = getNetwork(CONFIG.NETWORK);
  const { address, key } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  const nextPossibleNonce = await getNextNonce(CONFIG.NETWORK, address);
  // prepare function arguments
  const functionArgs = [
    Cl.contractPrincipal(...args.nftContract.split(".")),
    Cl.uint(args.tokenId),
  ];
  // configure contract call options
  const txOptions: SignedContractCallOptions = {
    anchorMode: AnchorMode.Any,
    contractAddress,
    contractName,
    functionName: "deposit-nft",
    functionArgs,
    network: networkObj,
    nonce: nextPossibleNonce,
    senderKey: key,
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
