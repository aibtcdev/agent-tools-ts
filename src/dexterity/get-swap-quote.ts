import { ContractId } from "dexterity-sdk";
import Dexterity from "./client";

try {
    const tokenX = process.argv[2] as ContractId;
    const tokenY = process.argv[3] as ContractId;
    const amount = Number(process.argv[4]);
    if (!tokenX || !tokenY || !amount) {
        throw new Error(`Invalid inputs, please use full contract ids and amountIn as a integer: <tokenIdIn> <tokenIdOut> <amountIn>`)
    }
    const quote = await Dexterity.getQuote(tokenX, tokenY, amount);
    console.log(JSON.stringify(quote, null, 2));
} catch (error) {
    console.error(error)
}