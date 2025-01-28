import Dexterity from "./client";

try {
    const vaults = await Dexterity.getVaults()
    console.log(JSON.stringify(vaults, null, 2));
} catch (error) {
    console.error(error)
}
