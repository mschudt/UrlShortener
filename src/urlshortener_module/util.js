export const generateNewRandomId = (length) => {
    // All characters that can appear in a random id.
    // Removed letters l, I, O, 0 due to legibility
    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    return result;
}
