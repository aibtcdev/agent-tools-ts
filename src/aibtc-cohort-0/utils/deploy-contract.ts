import {
  ClarityVersion,
  makeContractDeploy,
  PostConditionMode,
} from "@stacks/transactions";
import {
  AibtcCorePostResponse,
  broadcastTx,
  getNetwork,
  ToolResponse,
  TxBroadcastResultWithLink,
} from "../../utilities";
import { ContractResponse } from "@aibtc/types";
import { validateNetwork } from "@faktoryfun/core-sdk";

export type BroadcastedContractResponse = ContractResponse &
  TxBroadcastResultWithLink;

export type BroadcastedAndPostedResponse = {
  broadcastedContracts: Record<string, BroadcastedContractResponse>;
  aibtcCoreResponse: AibtcCorePostResponse;
};

export type DeploymentOptions = {
  address: string;
  key: string;
  network: string;
  nonce: number;
};

function validateClarityVersion(
  version: number | ClarityVersion
): ClarityVersion {
  const validVersions = Object.values(ClarityVersion);
  if (!validVersions.includes(version)) {
    throw new Error(
      `Invalid Clarity version: ${version}. Valid versions are: ${validVersions.join(
        ", "
      )}`
    );
  }
  return version as ClarityVersion;
}

export async function deployContract(
  contract: ContractResponse,
  deploymentOptions: DeploymentOptions
): Promise<ToolResponse<BroadcastedContractResponse>> {
  const { name, displayName, source } = contract;
  const { address, key, network, nonce } = deploymentOptions;
  //console.log(`Deploying contract ${name} from address: ${address}`);

  // Setup the contract deployer
  const validNetwork = validateNetwork(network);
  const networkObj = getNetwork(validNetwork);
  const validClarityVersion = validateClarityVersion(
    contract.clarityVersion ?? 3 // default to latest
  );
  if (!source) {
    throw new Error(`Contract source code is empty`);
  }

  // setting temp fee due to a bug in the default fee calculation
  const tempFee = BigInt(100_000); // 0.1 STX for contract deploy
  const transaction = await makeContractDeploy({
    contractName: displayName ?? name,
    codeBody: source,
    senderKey: key,
    nonce: nonce ?? 0,
    fee: tempFee,
    network: validNetwork,
    clarityVersion: validClarityVersion,
    postConditions: [], // empty, no transfers expected
    postConditionMode: PostConditionMode.Deny,
  });

  const broadcastResponse = await broadcastTx(transaction, networkObj);

  const fullResponse: BroadcastedContractResponse = {
    ...contract,
    ...broadcastResponse.data!,
  };

  return {
    success: broadcastResponse.success,
    message: broadcastResponse.message,
    data: fullResponse,
  };
}
