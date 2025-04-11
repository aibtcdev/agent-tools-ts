import {
  AnchorMode,
  Cl,
  makeContractCall,
  SignedContractCallOptions,
  PostConditionMode,
  Pc,
} from "@stacks/transactions";
import { ResourceData } from "../../../types/dao-types";
import {
  broadcastTx,
  CONFIG,
  createErrorResponse,
  deriveChildAccount,
  formatContractAddress,
  getNetwork,
  getNextNonce,
  getPmtContractInfo,
  getPmtResourceByIndex,
  getSbtcContract,
  getTokenTypeFromContractName,
  isValidContractPrincipal,
  sendToLLM,
} from "../../../../utilities";
import { TokenInfoService } from "../../../../api/token-info-service";

const usage =
  "Usage: bun run pay-invoice.ts <paymentProcessorContract> <resourceIndex> [memo]";
const usageExample =
  "Example: bun run pay-invoice.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.aibtc-payment-processor-stx 1";

interface ExpectedArgs {
  paymentProcessorContract: string;
  resourceIndex: number;
  memo?: string;
}

function validateArgs(): ExpectedArgs {
  // verify all required arguments are provided
  const [paymentProcessorContract, resourceIndexStr, memo] =
    process.argv.slice(2);
  const resourceIndex = parseInt(resourceIndexStr);
  if (!paymentProcessorContract || !resourceIndex) {
    const errorMessage = [
      `Invalid arguments: ${process.argv.slice(2).join(" ")}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // verify contract addresses extracted from arguments
  if (!isValidContractPrincipal(paymentProcessorContract)) {
    const errorMessage = [
      `Invalid contract address: ${paymentProcessorContract}`,
      usage,
      usageExample,
    ].join("\n");
    throw new Error(errorMessage);
  }
  // return validated arguments
  return {
    paymentProcessorContract,
    resourceIndex,
    memo,
  };
}

async function main() {
  // validate and store provided args
  const args = validateArgs();
  const { paymentProcessorContract, resourceIndex, memo } = args;
  const [contractAddress, contractName] = paymentProcessorContract.split(".");

  // Determine token type from contract name
  const tokenType = getTokenTypeFromContractName(contractName);

  // setup network and wallet info
  const networkObj = getNetwork(CONFIG.NETWORK);
  const { address, key } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  const nextPossibleNonce = await getNextNonce(CONFIG.NETWORK, address);

  // Get resource details to set proper post-conditions
  const resourceData = (await getPmtResourceByIndex(
    paymentProcessorContract,
    address,
    args.resourceIndex
  )) as ResourceData;

  //console.log(JSON.stringify(resourceData, null, 2));
  const { price } = resourceData;
  //console.log(`Price: ${price}`);

  const paymentProcessorContractData = await getPmtContractInfo(
    args.paymentProcessorContract,
    address
  );
  //console.log(JSON.stringify(paymentProcessorContractData, null, 2));

  // Set post-conditions based on token type and resource price
  const postCondition = async () => {
    switch (tokenType) {
      case "STX":
        return Pc.principal(address).willSendEq(price).ustx();
      case "BTC":
        const formattedSbtcContract = formatContractAddress(
          getSbtcContract(CONFIG.NETWORK)
        );
        return Pc.principal(address)
          .willSendEq(price)
          .ft(formattedSbtcContract, "sbtc-token");
      case "DAO":
        const formattedDaoContract = formatContractAddress(
          paymentProcessorContractData.daoTokenContract
        );
        if (!formattedDaoContract) {
          throw new Error(
            `DAO token contract not found in object ${JSON.stringify(
              paymentProcessorContractData,
              null,
              2
            )}`
          );
        }
        const tokenInfoService = new TokenInfoService(CONFIG.NETWORK);
        const assetName = await tokenInfoService.getAssetNameFromAbi(
          paymentProcessorContractData.daoTokenContract
        );
        if (!assetName) {
          throw new Error(
            `Asset name not found in object ${JSON.stringify(
              paymentProcessorContractData,
              null,
              2
            )}`
          );
        }
        return Pc.principal(address)
          .willSendEq(price)
          .ft(formattedDaoContract, assetName);
      default:
        return Pc.principal(address).willSendEq(price).ustx();
    }
  };
  //console.log(`Post conditions: ${JSON.stringify(postConditions, null, 2)}`);

  // prepare function arguments
  const functionArgs = [
    Cl.uint(resourceIndex),
    memo ? Cl.some(Cl.stringUtf8(memo)) : Cl.none(),
  ];

  // configure contract call options
  const txOptions: SignedContractCallOptions = {
    anchorMode: AnchorMode.Any,
    contractAddress,
    contractName,
    functionName: "pay-invoice",
    functionArgs,
    network: networkObj,
    nonce: nextPossibleNonce,
    senderKey: key,
    postConditionMode: PostConditionMode.Deny,
    postConditions: [postCondition],
  };

  console.log(
    `Paying invoice with ${tokenType} token for resource ${resourceIndex}`
  );

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
