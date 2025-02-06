import {
  callReadOnlyFunction,
  ClarityType,
  cvToJSON,
  getAddressFromPrivateKey,
  principalCV,
} from "@stacks/transactions";
import { CONFIG, deriveChildAccount, getNetwork } from "../../../../utilities";

// gets core proposal info from contract
async function main() {
  const [
    daoCoreProposalsExtensionContractAddress,
    daoCoreProposalsExtensionContractName,
  ] = process.argv[2]?.split(".") || [];
  const [daoProposalContractAddress, daoProposalContractName] =
    process.argv[3]?.split(".") || [];

  if (
    !daoCoreProposalsExtensionContractAddress ||
    !daoCoreProposalsExtensionContractName ||
    !daoProposalContractAddress ||
    !daoProposalContractName
  ) {
    console.log(
      "Usage: bun run get-proposal.ts <daoCoreProposalsExtensionContract> <daoProposalContract>"
    );
    console.log(
      "- e.g. bun run get-proposal.ts ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.wed-core-proposals ST35K818S3K2GSNEBC3M35GA3W8Q7X72KF4RVM3QA.wed-base-bootstrap-initialization"
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
    functionName: "get-proposal",
    functionArgs: [principalCV(daoProposalContractAddress)],
    senderAddress,
    network: networkObj,
  });

  if (result.type === ClarityType.OptionalNone) {
    console.log("Proposal not found");
  }
  if (result.type === ClarityType.OptionalSome) {
    const jsonResult = cvToJSON(result);
    // TODO: might need a better way to display the result
    console.log(jsonResult);
  }
}

main().catch((error) => {
  error instanceof Error
    ? console.error(JSON.stringify({ success: false, message: error.message }))
    : console.error(JSON.stringify({ success: false, message: String(error) }));
  process.exit(1);
});
