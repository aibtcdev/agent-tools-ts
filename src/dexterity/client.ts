import { Dexterity } from "dexterity-sdk";
import { CONFIG, deriveChildAccount, getNetwork } from "../utilities";

try {
    const { address, key } = await deriveChildAccount(
        CONFIG.NETWORK,
        CONFIG.MNEMONIC,
        CONFIG.ACCOUNT_INDEX
    );
    await Dexterity.configure({
        privateKey: key,
        stxAddress: address,
        apiKeyRotation: 'loop',
        parallelRequests: 10,
        maxHops: 4,
    });
    await Dexterity.discover()
} catch (error) {
    console.error(error)
}

export default Dexterity;
