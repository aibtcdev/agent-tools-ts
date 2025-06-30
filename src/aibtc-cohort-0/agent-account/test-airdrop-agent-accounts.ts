// ============================================================================
// Configuration
// ============================================================================

// --- Funder Information ---
// The account index from the .env MNEMONIC that will send the funds.
const FUNDER_ACCOUNT_INDEX = 0;

// --- Recipient Lists ---
// An array of standard Stacks accounts to receive the airdrop.
const AGENT_ACCOUNTS: string[] = [
  "ST3YT0XW92E6T2FE59B2G5N2WNNFSBZ6MZKQS5D18",
  "SP1PDVEHPWWKBC52WSNP1V0QHWGYDAP8ETJ8H67MT",
  "ST1M8KHCJXB3SBRQRDBCG3J3859AA1CN0AXDHQ3C0",
  "SP2BD8K7YW4984X0E82ZVBGMG9HY8R95JSYK2QB7M",
  "ST349A3QB5Z4CSTBKAG5ZJFCP5T3ABX1RZXJBQF3W",
  "ST31S76S7P99YHZK9TFYNMN6FG4A57KZ556BPRKEV",
  "ST2VWCTT3NYHZJRJYD7YJA0VZZ0QCG1ACVR2A5DCP",
  "ST2EMZSA1CQQCGJEQ9JSDBWBV0NFDJ59EH63XAPKY",
  "ST1M8KHCJXB3SBRQRDBCG3J3859AA1CN0AXDHQ3C0", // DUPLICATE
  "ST2TSG65G25BWVGKJSV4YAQMKXZNZAFDPMBABQ7B3",
  "SP37AEZVC0NRGSVJXBFTGYT5K6XHYZR59V7JR7J9T",
  "ST71N7X6G8KYGQPHZW7TB4PD1JZ6ND9AEV56NVJ1",
  "STRZ4P1ABSVSZPC4HZ4GDAW834HHEHJMF65X5S6D",
  "STRZ4P1ABSVSZPC4HZ4GDAW834HHEHJMF65X5S6D", // DUPLICATE
  "ST2EMZSA1CQQCGJEQ9JSDBWBV0NFDJ59EH63XAPKY", // DUPLICATE
];

// An array of smart contract wallet addresses to receive the airdrop.
const AGENT_WALLETS: string[] = [
  "ST1PE5V7DS1YPXGV1AZ80G7H6DNRHN79N23ZGE27N.aibtc-acct-ST3YT-S5D18-ST29T-BAZND",
  "ST1PE5V7DS1YPXGV1AZ80G7H6DNRHN79N23ZGE27N.aibtc-acct-SP1PD-H67MT-ST2B5-NEVZG",
  "ST1PE5V7DS1YPXGV1AZ80G7H6DNRHN79N23ZGE27N.aibtc-acct-ST1M8-HQ3C0-ST3KV-6706W",
  "ST1PE5V7DS1YPXGV1AZ80G7H6DNRHN79N23ZGE27N.aibtc-acct-SP2BD-2QB7M-ST1HY-9PH5H",
  "ST1PE5V7DS1YPXGV1AZ80G7H6DNRHN79N23ZGE27N.aibtc-acct-ST349-BQF3W-STTGV-Z6X47",
  "ST1PE5V7DS1YPXGV1AZ80G7H6DNRHN79N23ZGE27N.aibtc-acct-ST31S-PRKEV-ST17J-HEM1H",
  "ST1PE5V7DS1YPXGV1AZ80G7H6DNRHN79N23ZGE27N.aibtc-acct-ST2VW-A5DCP-ST108-SJBXF",
  "ST1PE5V7DS1YPXGV1AZ80G7H6DNRHN79N23ZGE27N.aibtc-acct-ST2EM-XAPKY-ST3H8-F2M3K",
  "ST1PE5V7DS1YPXGV1AZ80G7H6DNRHN79N23ZGE27N.aibtc-acct-ST1M8-HQ3C0-ST11K-4S5DC", // DUPLICATE OWNER
  "ST1PE5V7DS1YPXGV1AZ80G7H6DNRHN79N23ZGE27N.aibtc-acct-ST2TS-BQ7B3-ST3YT-84TFS",
  "ST1PE5V7DS1YPXGV1AZ80G7H6DNRHN79N23ZGE27N.aibtc-acct-SP37A-R7J9T-ST18F-R5XW4",
  "ST1PE5V7DS1YPXGV1AZ80G7H6DNRHN79N23ZGE27N.aibtc-acct-ST71N-6NVJ1-STF5N-8P9Q3",
  "ST1PE5V7DS1YPXGV1AZ80G7H6DNRHN79N23ZGE27N.aibtc-acct-STRZ4-X5S6D-ST1F3-MQWNJ", // DUPLICATE OWNER
  "ST1PE5V7DS1YPXGV1AZ80G7H6DNRHN79N23ZGE27N.aibtc-acct-STRZ4-X5S6D-ST1XM-BS1E6", // DUPLICATE OWNER
  "ST1PE5V7DS1YPXGV1AZ80G7H6DNRHN79N23ZGE27N.aibtc-acct-ST2EM-XAPKY-ST1YA-D9RPB", // DUPLICATE OWNER
];

// --- Airdrop Amounts (per recipient) ---
const STX_PER_RECIPIENT = 1000; // 1,000 STX
const SBTC_PER_RECIPIENT = 0.01; // 0.01 sBTC
const DAO_TOKEN_PER_RECIPIENT = 1_000_000; // 1,000,000 of the DAO token

// --- Contract & Token Details ---
const SBTC_CONTRACT_ID = "STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token";
const SBTC_DECIMALS = 8;

// DAO Token is now configured via deployer and name
const DAO_TOKEN_DEPLOYER = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"; // Example deployer
const DAO_TOKEN_NAME = "aibtc-token";
const DAO_TOKEN_DECIMALS = 8; // Assuming 8 decimals for the DAO token

// --- Script Configuration ---
// Delay in milliseconds between processing each recipient to avoid rate-limiting.
const DELAY_BETWEEN_RECIPIENTS_MS = 3000;

// ============================================================================
// Imports
// ============================================================================

import {
  makeSTXTokenTransfer,
  makeContractCall,
  uintCV,
  contractPrincipalCV,
  standardPrincipalCV,
  noneCV,
  fetchCallReadOnlyFunction,
  cvToValue,
} from "@stacks/transactions";
import {
  broadcastTx,
  CONFIG,
  deriveChildAccount,
  getNetwork,
  getNextNonce,
} from "../../utilities";

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Converts a standard token amount to its smallest unit (e.g., satoshis).
 * @param amount - The amount in standard units.
 * @param decimals - The number of decimal places for the token.
 * @returns The amount in the smallest unit as a bigint.
 */
function toSmallestUnit(amount: number, decimals: number): bigint {
  return BigInt(Math.floor(amount * 10 ** decimals));
}

/**
 * Fetches the balance of a fungible token for a given principal.
 * @param contractId - The contract ID of the FT (e.g., "address.contract-name").
 * @param principal - The principal to check the balance for.
 * @param network - The Stacks network object.
 * @returns The balance of the token as a bigint.
 */
async function getFtBalance(
  contractId: string,
  principal: string,
  network: any
): Promise<bigint> {
  const [contractAddress, contractName] = contractId.split(".");
  const resultCV = await fetchCallReadOnlyFunction({
    contractAddress,
    contractName,
    functionName: "get-balance",
    functionArgs: [standardPrincipalCV(principal)],
    senderAddress: principal,
    network,
  });

  const result = cvToValue(resultCV);
  // Handle functions that return (response uint err-code)
  if (result && typeof result === "object" && "success" in result) {
    if (result.success) {
      return BigInt(result.value);
    } else {
      throw new Error(
        `Failed to get balance for ${contractId}. Error: ${result.value}`
      );
    }
  }
  // Handle functions that return uint directly
  return BigInt(result);
}

/**
 * Checks the funder's balances against the required amounts for the airdrop.
 * @param funderAddress - The STX address of the funder.
 * @param requiredSTX - The total STX needed.
 * @param requiredSBTC - The total sBTC needed.
 * @param requiredDaoToken - The total DAO token needed.
 * @param daoTokenContractId - The full contract ID of the DAO token.
 */
async function checkFunderBalances(
  funderAddress: string,
  requiredSTX: bigint,
  requiredSBTC: bigint,
  requiredDaoToken: bigint,
  daoTokenContractId: string
) {
  console.log("\n📊 Verifying funder balances...");
  console.log(`   Funder: ${funderAddress}`);
  const networkObj = getNetwork(CONFIG.NETWORK);

  // 1. Check STX Balance
  
  const stxBalance = BigInt(accountInfo.balance);
  console.log(`   - STX Balance: ${Number(stxBalance) / 1e6} STX`);
  console.log(`   - Required STX: ${Number(requiredSTX) / 1e6} STX`);
  if (stxBalance < requiredSTX) {
    throw new Error("❌ Insufficient STX balance. Please use the faucet.");
  }
  console.log("     ✅ Sufficient STX balance.");

  // 2. Check sBTC Balance
  const sbtcBalance = await getFtBalance(
    SBTC_CONTRACT_ID,
    funderAddress,
    networkObj
  );
  console.log(
    `   - sBTC Balance: ${Number(sbtcBalance) / 10 ** SBTC_DECIMALS} sBTC`
  );
  console.log(
    `   - Required sBTC: ${Number(requiredSBTC) / 10 ** SBTC_DECIMALS} sBTC`
  );
  if (sbtcBalance < requiredSBTC) {
    throw new Error("❌ Insufficient sBTC balance.");
  }
  console.log("     ✅ Sufficient sBTC balance.");

  // 3. Check DAO Token Balance
  const daoTokenBalance = await getFtBalance(
    daoTokenContractId,
    funderAddress,
    networkObj
  );
  console.log(
    `   - DAO Token Balance: ${
      Number(daoTokenBalance) / 10 ** DAO_TOKEN_DECIMALS
    } DAO`
  );
  console.log(
    `   - Required DAO Token: ${
      Number(requiredDaoToken) / 10 ** DAO_TOKEN_DECIMALS
    } DAO`
  );
  if (daoTokenBalance < requiredDaoToken) {
    throw new Error("❌ Insufficient DAO Token balance.");
  }
  console.log("     ✅ Sufficient DAO Token balance.");
}

/**
 * Funds a list of standard Stacks accounts with STX, sBTC, and a DAO token.
 * @param funder - The funder's account info (address, key).
 * @param nonce - The starting nonce for the transactions.
 * @param daoTokenContractId - The full contract ID of the DAO token.
 * @returns The next available nonce after all transactions.
 */
async function fundStandardAccounts(
  funder: { address: string; key: string },
  nonce: number,
  daoTokenContractId: string
): Promise<number> {
  console.log("\n✈️  Funding Standard Agent Accounts...");
  const networkObj = getNetwork(CONFIG.NETWORK);

  const stxAmount = toSmallestUnit(STX_PER_RECIPIENT, 6);
  const sbtcAmount = toSmallestUnit(SBTC_PER_RECIPIENT, SBTC_DECIMALS);
  const daoTokenAmount = toSmallestUnit(
    DAO_TOKEN_PER_RECIPIENT,
    DAO_TOKEN_DECIMALS
  );

  const [sbtcContractAddress, sbtcContractName] = SBTC_CONTRACT_ID.split(".");
  const [daoTokenContractAddress, daoTokenContractName] =
    daoTokenContractId.split(".");

  for (const recipientAddress of AGENT_ACCOUNTS) {
    console.log(`\nProcessing account: ${recipientAddress}`);

    // 1. Transfer STX
    try {
      console.log(`   - Sending ${STX_PER_RECIPIENT} STX...`);
      const stxTx = await makeSTXTokenTransfer({
        recipient: recipientAddress,
        amount: stxAmount,
        senderKey: funder.key,
        network: networkObj,
        nonce,
      });
      const stxResult = await broadcastTx(stxTx, networkObj);
      if (stxResult.success) {
        console.log(`     ✅ Success! TXID: ${stxResult.data?.txid}`);
        nonce++;
      } else {
        console.log(`     ❌ Failed: ${JSON.stringify(stxResult.data)}`);
        // Decide if you want to stop or continue on failure
      }
    } catch (error: any) {
      console.log(`     ❌ Error sending STX: ${error.message}`);
    }

    // 2. Transfer sBTC
    try {
      console.log(`   - Sending ${SBTC_PER_RECIPIENT} sBTC...`);
      const sbtcTx = await makeContractCall({
        contractAddress: sbtcContractAddress,
        contractName: sbtcContractName,
        functionName: "transfer",
        functionArgs: [
          uintCV(sbtcAmount),
          standardPrincipalCV(funder.address),
          standardPrincipalCV(recipientAddress),
          noneCV(),
        ],
        senderKey: funder.key,
        network: networkObj,
        nonce,
      });
      const sbtcResult = await broadcastTx(sbtcTx, networkObj);
      if (sbtcResult.success) {
        console.log(`     ✅ Success! TXID: ${sbtcResult.data?.txid}`);
        nonce++;
      } else {
        console.log(`     ❌ Failed: ${JSON.stringify(sbtcResult.data)}`);
      }
    } catch (error: any) {
      console.log(`     ❌ Error sending sBTC: ${error.message}`);
    }

    // 3. Transfer DAO Token
    try {
      console.log(`   - Sending ${DAO_TOKEN_PER_RECIPIENT} DAO Token...`);
      const daoTokenTx = await makeContractCall({
        contractAddress: daoTokenContractAddress,
        contractName: daoTokenContractName,
        functionName: "transfer",
        functionArgs: [
          uintCV(daoTokenAmount),
          standardPrincipalCV(funder.address),
          standardPrincipalCV(recipientAddress),
          noneCV(),
        ],
        senderKey: funder.key,
        network: networkObj,
        nonce,
      });
      const daoTokenResult = await broadcastTx(daoTokenTx, networkObj);
      if (daoTokenResult.success) {
        console.log(`     ✅ Success! TXID: ${daoTokenResult.data?.txid}`);
        nonce++;
      } else {
        console.log(`     ❌ Failed: ${JSON.stringify(daoTokenResult.data)}`);
      }
    } catch (error: any) {
      console.log(`     ❌ Error sending DAO Token: ${error.message}`);
    }

    console.log(`   Waiting ${DELAY_BETWEEN_RECIPIENTS_MS / 1000}s...`);
    await new Promise((resolve) =>
      setTimeout(resolve, DELAY_BETWEEN_RECIPIENTS_MS)
    );
  }
  return nonce;
}

/**
 * Funds a list of smart contract wallets with STX, sBTC, and a DAO token.
 * @param funder - The funder's account info (address, key).
 * @param nonce - The starting nonce for the transactions.
 * @param daoTokenContractId - The full contract ID of the DAO token.
 * @returns The next available nonce after all transactions.
 */
async function fundSmartWallets(
  funder: { address: string; key: string },
  nonce: number,
  daoTokenContractId: string
): Promise<number> {
  console.log("\n✈️  Funding Smart Contract Wallets...");
  const networkObj = getNetwork(CONFIG.NETWORK);

  const stxAmount = toSmallestUnit(STX_PER_RECIPIENT, 6);
  const sbtcAmount = toSmallestUnit(SBTC_PER_RECIPIENT, SBTC_DECIMALS);
  const daoTokenAmount = toSmallestUnit(
    DAO_TOKEN_PER_RECIPIENT,
    DAO_TOKEN_DECIMALS
  );

  for (const walletContractId of AGENT_WALLETS) {
    console.log(`\nProcessing wallet: ${walletContractId}`);
    const [walletAddress, walletName] = walletContractId.split(".");

    // 1. Transfer STX (direct transfer to contract is possible)
    try {
      console.log(`   - Sending ${STX_PER_RECIPIENT} STX...`);
      const stxTx = await makeSTXTokenTransfer({
        recipient: walletContractId,
        amount: stxAmount,
        senderKey: funder.key,
        network: networkObj,
        nonce,
      });
      const stxResult = await broadcastTx(stxTx, networkObj);
      if (stxResult.success) {
        console.log(`     ✅ Success! TXID: ${stxResult.data?.txid}`);
        nonce++;
      } else {
        console.log(`     ❌ Failed: ${JSON.stringify(stxResult.data)}`);
      }
    } catch (error: any) {
      console.log(`     ❌ Error sending STX: ${error.message}`);
    }

    // 2. Deposit sBTC (via contract-call to a deposit function)
    try {
      console.log(`   - Depositing ${SBTC_PER_RECIPIENT} sBTC...`);
      const sbtcTx = await makeContractCall({
        contractAddress: walletAddress,
        contractName: walletName,
        functionName: "deposit-ft", // Assumed function name
        functionArgs: [
          contractPrincipalCV(
            SBTC_CONTRACT_ID.split(".")[0],
            SBTC_CONTRACT_ID.split(".")[1]
          ),
          uintCV(sbtcAmount),
        ],
        senderKey: funder.key,
        network: networkObj,
        nonce,
      });
      const sbtcResult = await broadcastTx(sbtcTx, networkObj);
      if (sbtcResult.success) {
        console.log(`     ✅ Success! TXID: ${sbtcResult.data?.txid}`);
        nonce++;
      } else {
        console.log(`     ❌ Failed: ${JSON.stringify(sbtcResult.data)}`);
      }
    } catch (error: any) {
      console.log(`     ❌ Error depositing sBTC: ${error.message}`);
    }

    // 3. Deposit DAO Token (via contract-call)
    try {
      console.log(`   - Depositing ${DAO_TOKEN_PER_RECIPIENT} DAO Token...`);
      const daoTokenTx = await makeContractCall({
        contractAddress: walletAddress,
        contractName: walletName,
        functionName: "deposit-ft", // Assumed function name
        functionArgs: [
          contractPrincipalCV(
            daoTokenContractId.split(".")[0],
            daoTokenContractId.split(".")[1]
          ),
          uintCV(daoTokenAmount),
        ],
        senderKey: funder.key,
        network: networkObj,
        nonce,
      });
      const daoTokenResult = await broadcastTx(daoTokenTx, networkObj);
      if (daoTokenResult.success) {
        console.log(`     ✅ Success! TXID: ${daoTokenResult.data?.txid}`);
        nonce++;
      } else {
        console.log(`     ❌ Failed: ${JSON.stringify(daoTokenResult.data)}`);
      }
    } catch (error: any) {
      console.log(`     ❌ Error depositing DAO Token: ${error.message}`);
    }

    console.log(`   Waiting ${DELAY_BETWEEN_RECIPIENTS_MS / 1000}s...`);
    await new Promise((resolve) =>
      setTimeout(resolve, DELAY_BETWEEN_RECIPIENTS_MS)
    );
  }
  return nonce;
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  console.log("🚀 Starting Airdrop Script for Agent Accounts & Wallets");
  console.log("========================================================");

  // --- 1. Setup Funder & Calculate Totals ---
  const funder = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    FUNDER_ACCOUNT_INDEX
  );

  const DAO_TOKEN_CONTRACT_ID = `${DAO_TOKEN_DEPLOYER}.${DAO_TOKEN_NAME}`;

  const totalRecipients = AGENT_ACCOUNTS.length + AGENT_WALLETS.length;
  const totalStx = toSmallestUnit(STX_PER_RECIPIENT * totalRecipients, 6);
  const totalSbtc = toSmallestUnit(
    SBTC_PER_RECIPIENT * totalRecipients,
    SBTC_DECIMALS
  );
  const totalDaoToken = toSmallestUnit(
    DAO_TOKEN_PER_RECIPIENT * totalRecipients,
    DAO_TOKEN_DECIMALS
  );

  // --- 2. Verify Funder's Balances (Now implemented) ---
  await checkFunderBalances(
    funder.address,
    totalStx,
    totalSbtc,
    totalDaoToken,
    DAO_TOKEN_CONTRACT_ID
  );

  // --- 3. Get Initial Nonce ---
  let currentNonce = await getNextNonce(CONFIG.NETWORK, funder.address);
  console.log(`\n🔑 Initial nonce for funder: ${currentNonce}`);

  // --- 4. Fund Standard Accounts ---
  if (AGENT_ACCOUNTS.length > 0) {
    currentNonce = await fundStandardAccounts(
      funder,
      currentNonce,
      DAO_TOKEN_CONTRACT_ID
    );
  } else {
    console.log("\nℹ️ No standard agent accounts to fund.");
  }

  // --- 5. Fund Smart Wallets ---
  if (AGENT_WALLETS.length > 0) {
    currentNonce = await fundSmartWallets(
      funder,
      currentNonce,
      DAO_TOKEN_CONTRACT_ID
    );
  } else {
    console.log("\nℹ️ No smart contract wallets to fund.");
  }

  console.log("\n" + "=".repeat(50));
  console.log("✅ Airdrop script finished.");
  console.log("========================================================");
}

main()
  .catch(console.error)
  .finally(() => {
    process.exit();
  });
