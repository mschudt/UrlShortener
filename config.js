// hostname and port can be passed as cli args
// default is set to the ip address of the eth0 network interface
let HOSTNAME = process.argv[2] || require("os").networkInterfaces().eth0[0].address;
// append "http://" to the start of the hostname if it's missing
HOSTNAME = HOSTNAME.startsWith("http://") ? HOSTNAME : "http://" + HOSTNAME;
// append "/" if it is missing
HOSTNAME = HOSTNAME.endsWith("/") ? HOSTNAME : HOSTNAME + "/";

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