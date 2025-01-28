import { ContractId, Opcode } from "dexterity-sdk";
import Dexterity from "./client";

try {
    const vaultId = process.argv[2] as ContractId;
    const tokenAmount = Number(process.argv[3]);
    
    if (!vaultId || !tokenAmount) {
        throw new Error(`Invalid inputs, please provide: <vaultId> <tokenAmount>`)
    }
    
    const result = await Dexterity.getVault(vaultId)?.executeTransaction(Opcode.removeLiquidity(), tokenAmount, {})
    console.log(JSON.stringify(result, null, 2))
} catch (error) {
    console.error(error)
}
