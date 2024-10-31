export interface TokenInfo {
  ft: string; // Full token identifier including asset name
  contractAddress: string; // Contract address
  contractName: string; // Contract name without asset
  assetName: string; // Asset name after ::
}

export const TokenMap: { [key: string]: string } = {
  WELSH:
    "SP3NE50GEXFG9SZGTT51P40X2CKYSZ5CC4ZTZ7A2G.welshcorgicoin-token::welshcorgicoin",
  CHA: "SP2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2T0Z55KS.charisma-token::charisma",
  ROO: "SP2C1WREHGM75C7TGFAEJPFKTFTEGZKF6DFT6E2GE.kangaroo::kangaroo",
  GOLF: "SP1CYY7BKYD60R08K734K9SC6GRZD4ZSN4WCDE5BD.golf-is-boring::GOLF",
  MIA: "SP1H1733V5MZ3SZ9XRW9FKYGEZT0JDGEB8Y634C7R.miamicoin-token-v2::miamicoin",
  DIKO: "SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.arkadiko-token::diko",
  USDA: "SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.usda-token::usda",
  $USS: "SP3F2NN8A1B75N64HWGY3R7E9XEJHGX3GY052312W.suss::suss",
  PEPE: "SP1Z92MPDQEWZXW36VX71Q25HKF5K2EPCJ304F275.tokensoft-token-v4k68639zxz::tokensoft-token",
  MAX: "SP7V1SE7EA3ZG3QTWSBA2AAG8SRHEYJ06EBBD1J2.max-token::max",
  INV: "SPV8C2N59MA417HYQNG6372GCV0SEQE01EV4Z1RQ.stacks-invaders-v0::stacks-invaders-v0",
  iQC: "SP2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2T0Z55KS.quiet-confidence::index-token",
  sCHA: "SP2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2T0Z55KS.liquid-staked-charisma::liquid-staked-token",
  NOT: "SP32AEEF6WW5Y0NMJ1S8SBSZDAY8R5J32NBZFPKKZ.nope::NOT",
  EDMUND:
    "SP1MJPVQ6ZE408ZW4JM6HET50S8GYTYRZ7PC6RKH7.edmundfitzgeraldcoin::EDMUND",
  aBTC: "SP2XD7417HGPRTREMKF748VNEQPDRR0RMANB7X1NK.token-abtc::bridged-btc",
  MSCB: "SP1GHMMZC2WKX7N63Z50E1SKW6S3JNQA4NH6WN7QF.squirrel-mclub::MSCB",
  CRE: "SP2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2T0Z55KS.creatures-core::creatures",
  sBTC: "ST2EZ389HBPTTTXDS0360D3EWQMZ27H9ZST0JH6N7.sbtc::sbtc",
  VELAR: "SP1Y5YSTAHZ88XYK1VPDH24GY0HPX5J4JECTMY4A1.velar-token::velar",
  LEO: "SP1AY6K3PQV5MRT6R4S671NWW2FRVPKM0BR162CT6.leo-token::leo",
  stSTX: "SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.ststx-token::ststx",
  sUSDT: "SP2XD7417HGPRTREMKF748VNEQPDRR0RMANB7X1NK.token-susdt::bridged-usdt",
  aeUSDC: "SP3Y2ZSH8P7D50B0VBTSX11S7XSG24M1VB9YFQA4K.token-aeusdc::aeUSDC",
  USDh: "SPN5AKG35QZSK2M8GAMR4AFX45659RJHDW353HSG.usdh-token-v1::usdh",
  ALEX: "SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM.token-alex::alex",
  LiSTX: "SM26NBC8SFHNW4P1Y4DFH27974P56WN86C92HPEHH.token-lqstx::lqstx",
  STSW: "SP1Z92MPDQEWZXW36VX71Q25HKF5K2EPCJ304F275.stsw-token-v4a",
  MEGA: "SP3D6PV2ACBPEKYJTCMH7HEN02KP87QSP8KTEH335.mega::mega",
  LiALEX:
    "SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM.auto-alex-v3::auto-alex-v3",
  Friedger:
    "SPN4Y5QPGQA8882ZXW90ADC2DHYXMSTN8VAR8C3X.friedger-token-v1::friedger",
  VIBES: "SP27BB1Y2DGSXZHS7G9YHKTSH6KQ6BD3QG0AN3CR9.vibes-token::vibes-token",
  ZERO: "SP1Z92MPDQEWZXW36VX71Q25HKF5K2EPCJ304F275.tokensoft-token-v4ktqebauw9::tokensoft-token",
  FARI: "SP213KNHB5QD308TEESY1ZMX1BP8EZDPG4JWD0MEA.fari-token-mn::fari",
  KANGA: "SP3J2H949KF8N4EPXKB42ZQT4EFGJFEW36DX20J1D.jackaroo-stxcity::KANGA",
  Clive: "SP371690BDHK9WRH3KXXRWNK62YR8N1P5JSYGQKRM.clive-stxcity::Clive",
  WEN: "SP25K3XPVBNWXPMYDXBPSZHGC8APW0Z21CWJ3Y3B1.wen-nakamoto-stxcity::WEN",
  BAO: "SP10VQCN71BZ0CXVKH7DF2H1MEQNKG9C49R9AHGKB.bao-stxcity::BAO",
  TRUTH:
    "SP2ECF9BD90CXW96XYT032MG6BQ2N6TRQ47V0D90R.september-11-stxcity::TRUTH",
  HOAX: "SP116BXQNYGH2SDF64Z68CRPKVTK93KWTVXTA2DYD.moon-landing-stxcity::HOAX",
  FlatEarth:
    "SP3W69VDG9VTZNG7NTW1QNCC1W45SNY98W1JSZBJH.flat-earth-stxcity::FlatEarth",
  BLEWY: "SP1HPB7YTZDXMZSZD51C113PQFAXKSNR0QYFFPWVC.blewy-stxcity::BLEWY",
  DGAF: "SP1NPDHF9CQ8B9Q045CCQS1MR9M9SGJ5TT6WFFCD2.honey-badger-stxcity::DGAF",
  MST: "SPKMQ8QD26HS1B2E9KXWCDKRF63X0RP8BZ361QTH.moneystack-stxcity::MST",
  FRESH: "SP2Z2CBMGWB9MQZAF5Z8X56KS69XRV3SJF4WKJ7J9.dry-sock-stxcity::FRESH",
  SKULL: "SP3BRXZ9Y7P5YP28PSR8YJT39RT51ZZBSECTCADGR.skullcoin-stxcity::SKULL",
  THCAM: "SP1QBKVTKP2DG8BGHQQD3KG6EBWWCB6V4X5NXQRYR.eth-thcam-stxcity::THCAM",
  FTC: "SP2PGA85MN3D1YVMRJK9WCGQT09Q9EZBCM7C3VNYA.fuck-the-cabal-stxcity::FTC",
  Moist:
    "SPBNZD0NMBJVRYJZ3SJ4MTRSZ3FEMGGTV2YM5MFV.moist-sock-bonding-curve::Moist",
  GYAT: "SP739VRRCMXY223XPR28BWEBTJMA0B27DY8GTKCH.gyatt-bonding-curve::GYAT",
  BOOSTER:
    "SP345FTTDC4VT580K18ER0MP5PR1ZRP5C3Q0KYA1P.booster-bonding-curve::BOOSTER",
  STONE: "SPQ5CEHETP8K4Q2FSNNK9ANMPAVBSA9NN86YSN59.stone-bonding-curve::STONE",
  FAIR: "SP253J64EGMH59TV32CQXXTVKH5TQVGN108TA5TND.fair-bonding-curve::FAIR",
};

export const TokenMapInverse: { [key: string]: string } = Object.entries(
  TokenMap
).reduce((acc, [symbol, ft]) => ({ ...acc, [ft]: symbol }), {});

// Helper function to get token symbol from contract
export function getTokenSymbol(ft: string): string {
  // Extract just the contract part without the asset name
  const [contractAddress, contractNameWithToken] = ft.split(".");
  const contractName = contractNameWithToken.split("::")[0];
  const fullFt = Object.keys(TokenMapInverse).find((key) =>
    key.startsWith(`${contractAddress}.${contractName}`)
  );
  return fullFt ? TokenMapInverse[fullFt] : "Unknown Token";
}

// Supported token pairs (all paired with STX)
export const SupportedPairs = Object.keys(TokenMap).map(
  (symbol) => `${symbol}-STX`
);

export function getTokenInfo(pairString: string): TokenInfo | null {
  // Parse pair (e.g., "PEPE-STX" -> "PEPE")
  const symbol = pairString.split("-")[0];

  // Get full token identifier
  const ft = TokenMap[symbol];
  if (!ft) {
    return null;
  }

  // Split into components
  const [contractPart, assetName] = ft.split("::");
  const [contractAddress, contractName] = contractPart.split(".");

  return {
    ft,
    contractAddress,
    contractName,
    assetName,
  };
}

// Jing contract constants
export const JING_CONTRACTS = {
  BID: {
    address: "SP1PF5HTB4HQN1RGJH0PCGY718Q652841N4XVVFMF",
    name: "jing",
  },
  ASK: {
    address: "SP1PF5HTB4HQN1RGJH0PCGY718Q652841N4XVVFMF",
    name: "cash",
  },
  YIN: {
    address: "SP1PF5HTB4HQN1RGJH0PCGY718Q652841N4XVVFMF",
    name: "yin",
  },
};

export function calculateBidFees(ustx: number): number {
  if (ustx > 10000000000) {
    return Math.ceil(ustx / 450); // 0.25% fee for >10,000 STX
  } else if (ustx > 5000000000) {
    return Math.ceil(ustx / 200); // 0.50% fee for >5,000 STX
  } else {
    return Math.ceil(ustx / 133); // 0.75% fee for <=5,000 STX
  }
}
