import { ContractId, LPToken, TokenMetadata, Vault } from "dexterity-sdk";
import Dexterity from "./client";

// decentralized liquidity pool

try {
    const name = process.argv[2] as string;
    const symbol = process.argv[3] as string;
    const image = process.argv[4] as string;
    const fee = parseInt(process.argv[5]);
    const tokenIdA = process.argv[6] as string;
    const tokenIdB = process.argv[7] as string;
    const reservesA = parseInt(process.argv[8]);
    const reservesB = parseInt(process.argv[9]);

    if (!name || !symbol || !tokenIdA || !tokenIdB) {
        throw new Error(`Invalid inputs, please provide: <name> <symbol> <tokenIdA> <tokenIdB>`)
    }

    const safeName = name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const description = `Liquidity Vault for ${name}`;
    
    const config: LPToken = {
        contractId: `${Dexterity.config.stxAddress}.${safeName}`,
        name,
        symbol,
        decimals: 6,
        identifier: symbol,
        description,
        image,
        fee,
        liquidity: [
            {...await Dexterity.getTokenInfo(tokenIdA), reserves: reservesA}, 
            {...await Dexterity.getTokenInfo(tokenIdB), reserves: reservesB}
        ],
    }

    const metadata: TokenMetadata = {
        name: config.name,
        symbol: config.symbol,
        decimals: config.decimals,
        identifier: config.identifier,
        description: config.description!,
        image: config.image!,
        properties: {
            lpRebatePercent: config.fee,
            tokenAContract: tokenIdA,
            tokenBContract: tokenIdB,
        }
    }

    // setup vault metadata
    const vault = new Vault(config)
    console.log(JSON.stringify(vault, null, 2))
    vault.updateMetadataWithStorage(metadata)

    // deploy vault
    const tx = await vault.deployContract()
    console.log(JSON.stringify(tx, null, 2))
} catch (error) {
    console.error(error)
}
