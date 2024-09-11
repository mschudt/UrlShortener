const randomWords = require("random-words");

export const generateNewIdAsRandomWord = (length) => {
    return randomWords({exactly: 1, maxLength: length});
}

export const StoredType = Object.freeze({"URL": 0, "Text": 1});
