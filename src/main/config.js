// hostname must be passed as the first commandline argument
let HOSTNAME = process.argv[2];
if (HOSTNAME === undefined) {
    console.error("The first argument passed must be a valid hostname. Like: https://example.com");
    process.exit();
}

// prepend https:// to the hostname if the passed hostname doesn't
// start with http:// or https://
HOSTNAME = HOSTNAME.startsWith("https://") || HOSTNAME.startsWith("http://") ? HOSTNAME : "https://" + HOSTNAME;
// append a / to the end of the hostname if it is missing
HOSTNAME = HOSTNAME.endsWith("/") ? HOSTNAME : HOSTNAME + "/";

// port can be passed as the second cli arg
const PORT = process.argv[3] || 3001;

// parameter length of the shortened url
const ID_LENGTH = 5;

// delete saved content after that many minutes
const LIFETIMES = [2, 5, 10, 30];

// Bound individual requests and total in-memory storage.
const FORM_BODY_LIMIT = "256kb";
const MAX_URL_BYTES = 8 * 1024;
const MAX_TEXT_BYTES = 64 * 1024;
const MAX_STORED_ENTRIES = 10_000;
const MAX_STORED_BYTES = 32 * 1024 * 1024;
const STORAGE_FULL_RETRY_SECONDS = 10;

// Leave the NODE_ENV variable on "development" if it was set to that.
// For all other values (including undefined), the assumed environment will be production.
process.env.NODE_ENV = process.env.NODE_ENV === "development" ? "development" : "production";

export {
    HOSTNAME,
    PORT,
    ID_LENGTH,
    LIFETIMES,
    FORM_BODY_LIMIT,
    MAX_URL_BYTES,
    MAX_TEXT_BYTES,
    MAX_STORED_ENTRIES,
    MAX_STORED_BYTES,
    STORAGE_FULL_RETRY_SECONDS
}
