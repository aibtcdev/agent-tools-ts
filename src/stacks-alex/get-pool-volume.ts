type VolumeValue = {
  block_height: number;
  volume_24h: number;
};

type PoolVolume = {
  token: number;
  volume_values: VolumeValue[];
};

async function getPoolVolume(pool_token_id: string): Promise<PoolVolume> {
  const response = await fetch(
    `https://api.alexgo.io/v1/pool_volume/${pool_token_id}?limit=10000`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get pool volume: ${response.statusText}`);
  }

  const data = (await response.json()) as PoolVolume;
  return data;
}

const poolTokenId = process.argv[2];
if (!poolTokenId) {
  console.error("Please provide a pool_token_id as an argument.");
  process.exit(1);
}

getPoolVolume(poolTokenId)
  .then((data) => {
    console.log(`Token: ${data.token}`);
    data.volume_values.forEach((volume) => {
      console.log(
        `Block Height: ${volume.block_height}, Volume 24h: ${volume.volume_24h}`
      );
    });
  })
  .catch((error) => console.error(error));
