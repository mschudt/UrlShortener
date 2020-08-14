const fs = require("fs");
const path = require("path");

const loadSourceFile = (filename) => {
    // build filepath and read in file as a string synchronously
    return fs.readFileSync(path.join(__dirname, "html", filename), {encoding: "utf8"});
}

const renderUnsuccessfulPage = () => {
    return loadSourceFile("top.html")
        + loadSourceFile("invalid.html")
        + loadSourceFile("bottom.html");
}

const renderIdNotFoundPage = () => {
    return loadSourceFile("top.html")
        + loadSourceFile("notfound.html")
        + loadSourceFile("bottom.html");
}

const renderSuccessfulPage = (createdId) => {
    const shortenedUrl = URL_PREFIX + createdId;
    return loadSourceFile("top.html")
        + `<p>Successfully created shortend link</p><div><input type="text" value="${shortenedUrl}"/></div><br/>`
        + `<p>Shorten another URL</p>`
        + loadSourceFile("bottom.html");
}

const renderStartingPage = () => {
    return loadSourceFile("top.html")
        + loadSourceFile("start.html")
        + loadSourceFile("bottom.html");
}

module.exports = {
    renderUnsuccessfulPage,
    renderIdNotFoundPage,
    renderSuccessfulPage,
    renderStartingPage
}