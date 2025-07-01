import { FaktorySDK } from "@faktoryfun/core-sdk";
import {
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
} from "../utilities";
import { readFileSync } from "fs";

const faktoryConfig = {
  network: CONFIG.NETWORK as "mainnet" | "testnet",
  hiroApiKey: CONFIG.HIRO_API_KEY,
};

const usage = [
  "Usage: bun run exec-airdrop.ts <mode> <token_contract> <options>",
  "",
  "Modes:",
  "  equal <total_amount> <recipients_file>     - Equal distribution to all recipients",
  "  custom <recipients_file>                   - Custom amounts per recipient",
  "  validate <total_amount> <recipients_file>  - Just validate balance without sending",
  "",
  "Files:",
  "  recipients_file should be a JSON file with wallet addresses",
  '  For equal mode: ["address1", "address2", ...]',
  '  For custom mode: [{"address": "addr1", "amount": 100, "memo": "optional"}, ...]',
  "",
  "Note: send-many supports max 200 recipients per transaction.",
  "      Large airdrops will be automatically batched.",
].join("\n");

const usageExample = [
  "Examples:",
  "  bun run exec-airdrop.ts equal 10000 recipients.json ST1ABC...XYZ.my-token",
  "  bun run exec-airdrop.ts custom custom-recipients.json ST1ABC...XYZ.my-token",
  "  bun run exec-airdrop.ts validate 5000 testnet-wallets.json ST1ABC...XYZ.dao-token",
].join("\n");

interface ExpectedArgs {
  mode: "equal" | "custom" | "validate";
  tokenContract: string;
  totalAmount?: number; // for equal and validate modes
  recipientsFile: string;
}

interface Recipient {
  address: string;
  amount?: number;
  memo?: string;
}

function validateArgs(): ExpectedArgs {
  const [mode, ...rest] = process.argv.slice(2);

  if (!["equal", "custom", "validate"].includes(mode)) {
    throw new Error(`Invalid mode: ${mode}\n${usage}\n${usageExample}`);
  }

  let tokenContract: string;
  let totalAmount: number | undefined;
  let recipientsFile: string;

  if (mode === "equal" || mode === "validate") {
    const [totalAmountStr, recipientsFileArg, tokenContractArg] = rest;
    totalAmount = parseFloat(totalAmountStr);
    recipientsFile = recipientsFileArg;
    tokenContract = tokenContractArg;

    if (!totalAmount || !recipientsFile || !tokenContract) {
      throw new Error(
        `Missing arguments for ${mode} mode\n${usage}\n${usageExample}`
      );
    }
  } else if (mode === "custom") {
    const [recipientsFileArg, tokenContractArg] = rest;
    recipientsFile = recipientsFileArg;
    tokenContract = tokenContractArg;

    if (!recipientsFile || !tokenContract) {
      throw new Error(
        `Missing arguments for custom mode\n${usage}\n${usageExample}`
      );
    }
  } else {
    throw new Error(`Unknown mode: ${mode}\n${usage}\n${usageExample}`);
  }

  // Validate contract address format
  const [contractAddress, contractName] = tokenContract.split(".");
  if (!contractAddress || !contractName) {
    throw new Error(
      `Invalid contract address: ${tokenContract}\n${usage}\n${usageExample}`
    );
  }

  return {
    mode: mode as "equal" | "custom" | "validate",
    tokenContract,
    totalAmount,
    recipientsFile,
  };
}

function loadRecipients(
  filePath: string,
  mode: "equal" | "custom" | "validate"
): Recipient[] {
  try {
    const fileContent = readFileSync(filePath, "utf-8");
    const data = JSON.parse(fileContent);

    if (mode === "equal" || mode === "validate") {
      // Expect array of addresses: ["addr1", "addr2", ...]
      if (!Array.isArray(data)) {
        throw new Error(
          "For equal/validate mode, recipients file should contain an array of addresses"
        );
      }

      return data.map((address: string) => {
        if (typeof address !== "string") {
          throw new Error("All recipients must be valid address strings");
        }
        return { address };
      });
    } else {
      // Custom mode: expect array of objects with address, amount, memo
      if (!Array.isArray(data)) {
        throw new Error(
          "For custom mode, recipients file should contain an array of recipient objects"
        );
      }

      return data.map((recipient: any) => {
        if (!recipient.address || typeof recipient.address !== "string") {
          throw new Error("Each recipient must have a valid address string");
        }
        if (recipient.amount && typeof recipient.amount !== "number") {
          throw new Error("Recipient amounts must be numbers");
        }
        return {
          address: recipient.address,
          amount: recipient.amount || 0,
          memo: recipient.memo || undefined,
        };
      });
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in recipients file: ${filePath}`);
    }
    throw new Error(
      `Failed to load recipients file: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

async function validateBalance(
  sdk: FaktorySDK,
  tokenContract: string,
  senderAddress: string,
  totalAmount: number
) {
  console.log("🔍 Validating balance...");

  const validation = await sdk.validateAirdropBalance({
    tokenContract,
    senderAddress,
    totalAmount,
  });

  if (!validation.hasEnoughBalance) {
    throw new Error(
      `❌ Insufficient balance!\n` +
        `Required: ${validation.requiredAmount}\n` +
        `Current:  ${validation.currentBalance}\n` +
        `Shortfall: ${validation.shortfall}`
    );
  }

  console.log("✅ Balance validation passed!");
  console.log(`Current balance: ${validation.currentBalance}`);
  console.log(`Required amount: ${validation.requiredAmount}`);
  return validation;
}

async function executeEqualAirdrop(
  sdk: FaktorySDK,
  tokenContract: string,
  senderAddress: string,
  totalAmount: number,
  recipients: Recipient[]
) {
  console.log(`📦 Preparing equal airdrop...`);
  console.log(`Total amount: ${totalAmount}`);
  console.log(`Recipients: ${recipients.length}`);
  console.log(`Amount per recipient: ${totalAmount / recipients.length}`);

  // Validate balance first
  await validateBalance(sdk, tokenContract, senderAddress, totalAmount);

  // Check if we need to batch (>200 recipients)
  if (recipients.length > 200) {
    console.log(
      `⚠️  Large airdrop detected (${recipients.length} recipients). Will batch into groups of 200.`
    );
    return await createBatchedAirdrop(
      sdk,
      tokenContract,
      senderAddress,
      recipients,
      "equal",
      totalAmount
    );
  }

  // Single batch
  const airdropParams = await sdk.getEqualAirdropParams({
    tokenContract,
    walletAddresses: recipients.map((r) => r.address),
    totalAmount,
    senderAddress,
    memo: "Airdrop",
  });

  console.log(
    `✅ Airdrop prepared - ${airdropParams.recipientCount} recipients`
  );
  return { type: "single", params: airdropParams };
}

async function executeCustomAirdrop(
  sdk: FaktorySDK,
  tokenContract: string,
  senderAddress: string,
  recipients: Recipient[]
) {
  console.log(`📦 Preparing custom airdrop...`);

  // Calculate total amount for validation
  const totalAmount = recipients.reduce((sum, r) => sum + (r.amount || 0), 0);
  console.log(`Total amount: ${totalAmount}`);
  console.log(`Recipients: ${recipients.length}`);

  // Validate balance first
  await validateBalance(sdk, tokenContract, senderAddress, totalAmount);

  // Check if we need to batch (>200 recipients)
  if (recipients.length > 200) {
    console.log(
      `⚠️  Large airdrop detected (${recipients.length} recipients). Will batch into groups of 200.`
    );
    return await createBatchedAirdrop(
      sdk,
      tokenContract,
      senderAddress,
      recipients,
      "custom"
    );
  }

  // Single batch
  const airdropParams = await sdk.getAirdropParams({
    tokenContract,
    recipients: recipients.map((r) => ({
      address: r.address,
      amount: r.amount || 0,
      memo: r.memo,
    })),
    senderAddress,
  });

  console.log(
    `✅ Custom airdrop prepared - ${airdropParams.recipientCount} recipients`
  );
  return { type: "single", params: airdropParams };
}

async function createBatchedAirdrop(
  sdk: FaktorySDK,
  tokenContract: string,
  senderAddress: string,
  recipients: Recipient[],
  mode: "equal" | "custom",
  totalAmount?: number
) {
  const BATCH_SIZE = 200;
  const batches = [];

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batchRecipients = recipients.slice(i, i + BATCH_SIZE);

    let batchParams: any;

    if (mode === "equal" && totalAmount) {
      // For equal mode, calculate the portion of total amount for this batch
      const batchTotalAmount =
        (totalAmount * batchRecipients.length) / recipients.length;

      batchParams = await sdk.getEqualAirdropParams({
        tokenContract,
        walletAddresses: batchRecipients.map((r) => r.address),
        totalAmount: batchTotalAmount,
        senderAddress,
        memo: "Airdrop",
      });
    } else {
      // Custom mode
      batchParams = await sdk.getAirdropParams({
        tokenContract,
        recipients: batchRecipients.map((r) => ({
          address: r.address,
          amount: r.amount || 0,
          memo: r.memo,
        })),
        senderAddress,
      });
    }

    batches.push({
      ...batchParams,
      batchIndex: Math.floor(i / BATCH_SIZE),
      batchSize: batchRecipients.length,
      isLastBatch: i + BATCH_SIZE >= recipients.length,
    });
  }

  return {
    type: "batched",
    batches,
    totalBatches: batches.length,
    totalRecipients: recipients.length,
  };
}

async function handleBatchedAirdrop(
  airdropResult: any,
  networkObj: any,
  key: string,
  address: string
) {
  // Check if this is a batched airdrop
  if (airdropResult.type === "batched") {
    console.log(`🚀 Executing batched airdrop...`);
    console.log(`Total batches: ${airdropResult.totalBatches}`);

    const results = [];

    for (let i = 0; i < airdropResult.batches.length; i++) {
      const batch = airdropResult.batches[i];
      console.log(
        `\n📤 Executing batch ${i + 1}/${airdropResult.totalBatches}`
      );
      console.log(`Recipients in batch: ${batch.batchSize}`);

      const nextNonce = await getNextNonce(CONFIG.NETWORK, address);

      const txOptions: SignedContractCallOptions = {
        ...(batch as any),
        network: networkObj,
        nonce: nextNonce,
        senderKey: key,
      };

      const transaction = await makeContractCall(txOptions);
      const broadcastResponse = await broadcastTx(transaction, networkObj);

      console.log(
        `✅ Batch ${i + 1} sent: ${
          broadcastResponse.success
            ? broadcastResponse.result?.txid || "Transaction sent"
            : "Failed"
        }`
      );
      results.push(broadcastResponse);

      // Add delay between batches to avoid nonce conflicts
      if (i < airdropResult.batches.length - 1) {
        console.log("⏳ Waiting 10 seconds before next batch...");
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }
    }

    return {
      type: "batched_airdrop",
      totalBatches: airdropResult.totalBatches,
      totalRecipients: airdropResult.totalRecipients,
      results,
    };
  } else {
    // Single transaction
    console.log(`🚀 Executing single airdrop transaction...`);

    const nextNonce = await getNextNonce(CONFIG.NETWORK, address);

    const txOptions: SignedContractCallOptions = {
      ...(airdropResult.params as any),
      network: networkObj,
      nonce: nextNonce,
      senderKey: key,
    };

    const transaction = await makeContractCall(txOptions);
    const broadcastResponse = await broadcastTx(transaction, networkObj);

    return {
      type: "single_airdrop",
      recipients: airdropResult.params.recipientCount,
      result: broadcastResponse,
    };
  }
}

async function main() {
  // Validate and store provided args
  const args = validateArgs();

  // Setup network and wallet info
  const networkObj = getNetwork(CONFIG.NETWORK);
  const { address, key } = await deriveChildAccount(
    CONFIG.NETWORK,
    CONFIG.MNEMONIC,
    CONFIG.ACCOUNT_INDEX
  );

  const sdk = new FaktorySDK(faktoryConfig);

  // Load recipients from file
  console.log(`📂 Loading recipients from ${args.recipientsFile}...`);
  const recipients = loadRecipients(args.recipientsFile, args.mode);
  console.log(`✅ Loaded ${recipients.length} recipients`);

  // Handle different modes
  let airdropResult: any;

  switch (args.mode) {
    case "validate":
      if (!args.totalAmount) {
        throw new Error("Total amount is required for validate mode");
      }
      await validateBalance(sdk, args.tokenContract, address, args.totalAmount);
      return {
        mode: "validation",
        message: "Balance validation passed",
        totalAmount: args.totalAmount,
        recipients: recipients.length,
      };

    case "equal":
      if (!args.totalAmount) {
        throw new Error("Total amount is required for equal mode");
      }
      airdropResult = await executeEqualAirdrop(
        sdk,
        args.tokenContract,
        address,
        args.totalAmount,
        recipients
      );
      break;

    case "custom":
      airdropResult = await executeCustomAirdrop(
        sdk,
        args.tokenContract,
        address,
        recipients
      );
      break;

    default:
      throw new Error(`Unknown mode: ${args.mode}`);
  }

  // Execute the airdrop (handle both single and batched)
  return await handleBatchedAirdrop(airdropResult, networkObj, key, address);
}

main()
  .then((result) => {
    // Format the result to match ToolResponse structure
    const toolResponse = {
      success: true,
      message: "Airdrop completed successfully",
      result: result,
    };
    sendToLLM(toolResponse);
  })
  .catch((error) => {
    sendToLLM(createErrorResponse(error));
    process.exit(1);
  });
