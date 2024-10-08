type Swap = {
  id: number;
  base: string;
  baseSymbol: string;
  baseId: string;
  quote: string;
  quoteSymbol: string;
  quoteId: string;
  baseVolume: number;
  quoteVolume: number;
  lastBasePriceInUSD: number;
  lastQuotePriceInUSD: number;
};

async function getAllSwaps() {
  const response = await fetch("https://api.alexgo.io/v1/allswaps", {
    headers: {
      Accept: "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to get all swaps: ${response.statusText}`);
  }
  const data = (await response.json()) as Swap[];

  return data;
}

const swaps = await getAllSwaps();
for (const swap of swaps) {
  console.log(`id: ${swap.id}`);
  console.log(`base: ${swap.base}`);
  console.log(`baseSymbol: ${swap.baseSymbol}`);
  console.log(`baseId: ${swap.baseId}`);
  console.log(`quote: ${swap.quote}`);
  console.log(`quoteSymbol: ${swap.quoteSymbol}`);
  console.log(`quoteId: ${swap.quoteId}`);
  console.log(`baseVolume: ${swap.baseVolume}`);
  console.log(`quoteVolume: ${swap.quoteVolume}`);
  console.log(`lastBasePriceInUSD: ${swap.lastBasePriceInUSD}`);
  console.log(`lastQuotePriceInUSD: ${swap.lastQuotePriceInUSD}`);
  console.log("---"); // Separator for readability
}
