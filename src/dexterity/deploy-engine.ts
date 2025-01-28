import { ContractId } from "dexterity-sdk";
import Dexterity from "./client";

// farming rewards engine

try {
    const vaultId = process.argv[3] as ContractId;
            
    if (!vaultId) {
        throw new Error(`Invalid inputs, please provide: <vaultId>`)
    }

    // deploy engine
    const result = await Dexterity.getVault(vaultId)?.deployHoldToEarnContract()
    console.log(JSON.stringify(result, null, 2))

    // configure vault metadata
    const vault = Dexterity.getVault(vaultId)
    const contractName = vaultId.split('.')[1]
    const engineContractId = `${Dexterity.config.stxAddress}.${contractName}-hold-to-earn`
    const config: any = { properties: { engineContractId } }
    await vault?.updateMetadataWithStorage(config)
} catch (error) {
    console.error(error)
}
