import { CONFIG, getApiUrl } from "../utilities";

interface STXBalance {
  balance: string;
  locked: string;
  burnchain_unlock_height: number;
}

async function getSTXBalance(address: string): Promise<STXBalance> {
  try {
    const apiUrl = getApiUrl(CONFIG.NETWORK);
    const response = await fetch(`${apiUrl}/extended/v1/address/${address}/stx`);
    if (!response.ok) {
      throw new Error(`Failed to get STX balance: ${response.statusText}`);
    }
    const data = await response.json();
    return data as STXBalance;
  } catch (error) {
    console.error(`Error: ${error}`);
    throw error;
  }
}

function formatSTXBalance(balance: STXBalance) {
  const unlocked = BigInt(balance.balance);
  const locked = BigInt(balance.locked);
  const total = unlocked + locked;

  return {
    unlocked: {
      microSTX: unlocked.toString(),
      STX: Number(unlocked) / 1000000
    },
    locked: {
      microSTX: locked.toString(),
      STX: Number(locked) / 1000000
    },
    total: {
      microSTX: total.toString(),
      STX: Number(total) / 1000000
    }
  };
}

async function main() {
  const address = process.argv[2];
  if (!address) {
    console.error("No address provided. Usage: bun run get-stx-balance.ts <address>");
    process.exit(1);
  }

  try {
    const balance = await getSTXBalance(address);
    const formattedBalance = formatSTXBalance(balance);
    console.log(JSON.stringify(formattedBalance, null, 2));
  } catch (error) {
    console.error(`Error: ${error}`);
    process.exit(1);
  }
}

main();