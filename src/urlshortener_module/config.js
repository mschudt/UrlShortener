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

// delete saved urls after that many milliseconds
const ID_LIFETIMES = [2, 5, 10, 30];

// Leave the NODE_ENV variable on "development" if it was set to that.
// For all other values (including undefined), the assumed environment will be production.
process.env.NODE_ENV = process.env.NODE_ENV === "development" ? "development" : "production";

export {
    HOSTNAME,
    PORT,
    ID_LENGTH,
    ID_LIFETIMES
}