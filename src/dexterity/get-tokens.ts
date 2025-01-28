import Dexterity from "./client";

try {
    const tokens = await Dexterity.getTokens()
    console.log(JSON.stringify(tokens, null, 2));
} catch (error) {
    console.error(error)
}
