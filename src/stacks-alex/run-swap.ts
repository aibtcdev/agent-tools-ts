import { AlexSDK, Currency } from "alex-sdk";

async function runSwap(
  address: string,
  fromCurrency: string,
  toCurrency: string,
  amount: string,
  minToReceive: string = "0"
) {
  try {
    // Initialize the SDK
    const alex = new AlexSDK();

    // Validate address format (basic check)
    if (!address.startsWith("ST") && !address.startsWith("SM")) {
      throw new Error(
        "Invalid STX address format. Address should start with ST or SM."
      );
    }

    // Validate currencies
    if (!(fromCurrency in Currency) || !(toCurrency in Currency)) {
      throw new Error(
        "Invalid currency. Use one of: " + Object.keys(Currency).join(", ")
      );
    }

    // Parse amounts
    const parsedAmount = parseFloat(amount);
    const parsedMinToReceive = parseFloat(minToReceive);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      throw new Error("Invalid amount. Please provide a positive number.");
    }

    if (isNaN(parsedMinToReceive) || parsedMinToReceive < 0) {
      throw new Error(
        "Invalid minimum to receive. Please provide a non-negative number."
      );
    }

    // Convert to microunits (most tokens use 8 decimal places)
    const amountMicrounits = BigInt(Math.floor(parsedAmount * 1e8));
    const minToReceiveMicrounits = BigInt(Math.floor(parsedMinToReceive * 1e8));

    // Get the transaction object to broadcast
    const tx = await alex.runSwap(
      address,
      Currency[fromCurrency as keyof typeof Currency],
      Currency[toCurrency as keyof typeof Currency],
      amountMicrounits,
      minToReceiveMicrounits
    );

    console.log(
      `Generated swap transaction for ${parsedAmount} ${fromCurrency} to ${toCurrency}:`
    );
    console.log(JSON.stringify(tx, null, 2));
    console.log(
      `\nNote: This transaction needs to be broadcasted using openContractCall or another broadcast method.`
    );

    return tx;
  } catch (error) {
    console.error("Error generating swap transaction:", error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 4) {
  console.log(
    "Usage: bun run-swap.ts <address> <fromCurrency> <toCurrency> <amount> [minToReceive]"
  );
  console.log(
    "Example: bun run-swap.ts ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG STX ALEX 100 0"
  );
  process.exit(1);
}

const address = args[0];
const fromCurrency = args[1];
const toCurrency = args[2];
const amount = args[3];
const minToReceive = args[4] || "0";

// Execute the function
await runSwap(address, fromCurrency, toCurrency, amount, minToReceive);

export {};
