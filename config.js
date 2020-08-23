// hostname must be passed as the first commandline argument
let HOSTNAME = process.argv[2];
if (HOSTNAME === undefined) {
    console.error("The first argument passed must be a valid hostname. Like: https://example.com");
    process.exit();
}

// append "https://" to the start of the hostname if it's missing
HOSTNAME = HOSTNAME.startsWith("https://") ? HOSTNAME : "https://" + HOSTNAME;
// append "/" if it is missing
HOSTNAME = HOSTNAME.endsWith("/") ? HOSTNAME : HOSTNAME + "/";

// port can be passed as the second cli arg
const PORT = process.argv[3] || "3001";

// parameter length of the shortened url
const ID_LENGTH = 5;

// delete saved urls after that many milliseconds
const ID_LIFETIMES = [2, 5, 10, 30];

module.exports = {
    HOSTNAME,
    PORT,
    ID_LENGTH,
    ID_LIFETIMES
}