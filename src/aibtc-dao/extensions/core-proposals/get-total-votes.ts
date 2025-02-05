import {
  callReadOnlyFunction,
  cvToValue,
  getAddressFromPrivateKey,
  principalCV,
} from "@stacks/transactions";
import { CONFIG, deriveChildAccount, getNetwork } from "../../../utilities";

// gets total votes from core proposal contract for a given voter

async function main() {
  const [
    daoCoreProposalsExtensionContractAddress,
    daoCoreProposalsExtensionContractName,
  ] = process.argv[2]?.split(".") || [];
  const [daoProposalContractAddress, daoProposalContractName] =
    process.argv[3]?.split(".") || [];
  const voterAddress = process.argv[4];

  if (
    !daoCoreProposalsExtensionContractAddress ||
    !daoCoreProposalsExtensionContractName ||
    !daoProposalContractAddress ||
    !daoProposalContractName ||
    !voterAddress
  ) {
    console.log(
      "Usage: bun run get-total-votes.ts <daoCoreProposalsExtensionContract> <daoProposalContract> <voterAddress>"
    );
    console.log(
      "- e.g. bun run get-total-votes.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.wed-core-proposals ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.wed-base-bootstrap-initialization ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA"
    );

    process.exit(1);
  }

  const networkObj = getNetwork(CONFIG.NETWORK);
  const { key } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );
  const senderAddress = getAddressFromPrivateKey(key, networkObj.version);

  const result = await callReadOnlyFunction({
    contractAddress: daoCoreProposalsExtensionContractAddress,
    contractName: daoCoreProposalsExtensionContractName,
    functionName: "get-total-votes",
    functionArgs: [
      principalCV(daoProposalContractAddress),
      principalCV(voterAddress),
    ],
    senderAddress,
    network: networkObj,
  });

  const parsedResult = cvToValue(result, true);
  console.log(parsedResult);
}

main().catch((error) => {
  error instanceof Error
    ? console.error(JSON.stringify({ success: false, message: error.message }))
    : console.error(JSON.stringify({ success: false, message: String(error) }));
  process.exit(1);
});
