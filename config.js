// hostname and port can be passed as cli args
const HOSTNAME = process.argv[2] || "0.0.0.0";
const PORT = process.argv[3] || "3001";

// parameter length of the shortened url
const ID_LENGTH = 5;

// delete saved urls after that many milliseconds
const ID_LIFETIME = 2 * 60 * 1000;

module.exports = {
    HOSTNAME,
    PORT,
    ID_LENGTH,
    ID_LIFETIME
}