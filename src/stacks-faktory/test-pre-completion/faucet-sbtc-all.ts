// faucet-sbtc-all.ts
// Call sBTC faucet for accounts 0-9
import {
  makeContractCall,
  SignedContractCallOptions,
} from "@stacks/transactions";
import {
  broadcastTx,
  CONFIG,
  deriveChildAccount,
  getNetwork,
  getNextNonce,
} from "../../utilities";

const SBTC_CONTRACT = "STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token";

async function callFaucetForAccount(accountIndex: number) {
  console.log(`\n💰 Account ${accountIndex}: Calling sBTC faucet...`);

  try {
    const { address, key } = await deriveChildAccount(
      CONFIG.NETWORK,
      CONFIG.MNEMONIC,
      accountIndex
    );

    const networkObj = getNetwork(CONFIG.NETWORK);
    const nonce = await getNextNonce(CONFIG.NETWORK, address);

    console.log(`   Address: ${address}`);

    const [contractAddress, contractName] = SBTC_CONTRACT.split(".");

    const txOptions: SignedContractCallOptions = {
      contractAddress,
      contractName,
      functionName: "faucet",
      functionArgs: [], // No arguments
      network: networkObj,
      nonce,
      senderKey: key,
    };

    const transaction = await makeContractCall(txOptions);
    const broadcastResponse = await broadcastTx(transaction, networkObj);

    if (broadcastResponse.success) {
      console.log(`✅ Account ${accountIndex}: sBTC faucet successful`);
      console.log(`   TX: ${broadcastResponse.data?.txid}`);
      return true;
    } else {
      console.log(`❌ Account ${accountIndex}: sBTC faucet failed`);
      return false;
    }
  } catch (error: any) {
    console.log(`❌ Account ${accountIndex}: Error - ${error.message}`);
    return false;
  }
}

async function main() {
  console.log("🪙 Getting sBTC from faucet for all test accounts");
  console.log("================================================");

  let successCount = 0;

  // Call faucet for accounts 0-9
  for (let i = 0; i <= 9; i++) {
    const success = await callFaucetForAccount(i);
    if (success) successCount++;

    // Rate limiting delay
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  console.log(`\n📊 Summary: ${successCount}/10 accounts funded with sBTC`);
  console.log("💡 Now all accounts should have sBTC for buying seats!");
  console.log("💡 Next: Run the pre-launch completion test");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Faucet script failed:", error);
    process.exit(1);
  });
