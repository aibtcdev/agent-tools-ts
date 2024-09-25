import {
  AnchorMode,
  broadcastTransaction,
  makeContractCall,
  principalCV,
  uintCV,
} from "@stacks/transactions";
import { bytesToHex } from "@stacks/common";
import {
  CONFIG,
  deriveChildAccount,
  getNetwork,
  getStakingDaoContractID,
  logBroadCastResult,
  stakingDaoContractAddress,
  stakingDaoContractNames,
} from "../../utilities";

// CONFIGURATION
const networkObj = getNetwork(CONFIG.NETWORK);

//sends transaction to initiateWithdraw on StakingDao Contract
async function withdraw(nftId: Number) {
  try {
    // get account info from env
    const network = CONFIG.NETWORK;
    const mnemonic = CONFIG.MNEMONIC;
    const accountIndex = CONFIG.ACCOUNT_INDEX;

    // get account address and private key
    const { address, key } = await deriveChildAccount(
      network,
      mnemonic,
      accountIndex
    );

    const transaction = await makeContractCall({
      contractAddress: stakingDaoContractAddress,
      contractName: stakingDaoContractNames.baseContract,
      functionName: "withdraw",
      functionArgs: [
        principalCV(
          getStakingDaoContractID(stakingDaoContractNames.reserveContract)
        ),
        principalCV(
          getStakingDaoContractID(stakingDaoContractNames.directHelpers)
        ),
        principalCV(
          getStakingDaoContractID(stakingDaoContractNames.stakingContract)
        ),
        uintCV(Number(nftId)),
      ],
      senderKey: key,
      validateWithAbi: true,
      network,
      anchorMode: AnchorMode.Any,
    });

    // To see the raw serialized transaction
    const serializedTx = transaction.serialize();
    const serializedTxHex = bytesToHex(serializedTx);
    console.log(`Serialized Transaction (Hex): ${serializedTxHex}`);

    // Broadcast the transaction
    const broadcastResponse = await broadcastTransaction(
      transaction,
      networkObj
    );
    return {
      from: address,
      ...broadcastResponse,
    };
  } catch (error) {
    console.error(`Error while sending withdraw transaction : ${error}`);
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.log("Usage: bun run withdraw.ts <nftID>'");
    return;
  }
  const nftID = Number(args[0]);
  if (!nftID || !Number.isInteger(nftID)) {
    console.error("Please provide valid number as argument for nftID");
    return;
  }
  let response = await withdraw(nftID);
  //return if response is null as the error  is logged by the returning function
  if (!response) {
    return;
  }
  logBroadCastResult(response, response.from);
}

main();
