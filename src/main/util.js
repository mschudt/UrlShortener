const randomWords = require("random-words");

// Current and known route/static path segments that must not be generated as URL ids.
const reservedShortUrlIds = new Set([
    "create",
    "favicon",
    "raw",
    "text",
    "use",
]);

export const isReservedShortUrlId = (id) => {
    return reservedShortUrlIds.has(id);
}

export const generateNewIdAsRandomWord = (length) => {
    let randomId;
    do {
        randomId = randomWords({exactly: 1, maxLength: length})[0];
    } while (isReservedShortUrlId(randomId));

    return randomId;
}

export const StoredType = Object.freeze({"URL": 0, "Text": 1});
