const randomWords = require("random-words");
const {randomInt} = require("crypto");

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

const wordsByMaximumLength = new Map();

const getWordsWithMaximumLength = (length) => {
    if (!wordsByMaximumLength.has(length)) {
        wordsByMaximumLength.set(
            length,
            randomWords.wordList.filter(word => word.length <= length && !isReservedShortUrlId(word))
        );
    }

    return wordsByMaximumLength.get(length);
}

const randomCandidateIndex = (wordCount, wordTotal) => {
    const base = BigInt(wordTotal);
    let index = 0n;

    for (let position = 0; position < wordCount; position += 1) {
        index = index * base + BigInt(randomInt(wordTotal));
    }

    return index;
}

const buildCandidate = (words, wordCount, candidateIndex) => {
    const base = BigInt(words.length);
    const candidateWords = new Array(wordCount);
    let remainingIndex = candidateIndex;

    for (let position = wordCount - 1; position >= 0; position -= 1) {
        candidateWords[position] = words[Number(remainingIndex % base)];
        remainingIndex /= base;
    }

    return candidateWords.join("");
}

export const generateUniqueWordId = (words, isInUse = () => false) => {
    const usableWords = words.filter(word => !isReservedShortUrlId(word));
    if (usableWords.length === 0) {
        throw new Error("At least one non-reserved word is required to generate an id.");
    }

    const base = BigInt(usableWords.length);
    for (let wordCount = 1; ; wordCount += 1) {
        let candidateTotal = 1n;
        for (let position = 0; position < wordCount; position += 1) {
            candidateTotal *= base;
        }
        const startingIndex = randomCandidateIndex(wordCount, usableWords.length);

        // Visit every candidate once from a random starting point. Only move to
        // an additional word after every shorter candidate is occupied.
        for (let offset = 0n; offset < candidateTotal; offset += 1n) {
            const candidateIndex = (startingIndex + offset) % candidateTotal;
            const candidate = buildCandidate(usableWords, wordCount, candidateIndex);
            if (!isReservedShortUrlId(candidate) && !isInUse(candidate)) {
                return candidate;
            }
        }
    }
}

export const generateNewIdAsRandomWord = (length, isInUse = () => false) => {
    return generateUniqueWordId(getWordsWithMaximumLength(length), isInUse);
}

export const StoredType = Object.freeze({"URL": 0, "Text": 1});
