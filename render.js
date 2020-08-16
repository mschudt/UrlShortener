const fs = require("fs");
const path = require("path");
const Config = require("./config");

const loadSourceFile = (filename) => {
    // build filepath and read in file as a string synchronously
    return fs.readFileSync(path.join(__dirname, "static", "html", filename), {encoding: "utf8"});
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
    const shortenedUrl = Config.HOSTNAME + createdId;
    return loadSourceFile("top.html")
        + `<p>Successfully created shortend link</p><div><input type="text" size="${shortenedUrl.length - 5}ch" value="${shortenedUrl}"/></div><br/>`
        + `<p>Shorten another URL</p>`
        + loadSourceFile("bottom.html");
}

const renderStartingPage = () => {
    return loadSourceFile("top.html")
        + loadSourceFile("start.html")
        + loadSourceFile("bottom.html");
}

const renderRawUrlPage = (resolvedUrl) => {
    return loadSourceFile("top.html")
        + `<p><input type="text" size="${resolvedUrl.length - 5}ch" value="${resolvedUrl}"/></p>`
        + `<p><a href="${resolvedUrl}"><input style="width: 10ch" type="button" value="Redirect"/></a></p>`;
}

module.exports = {
    renderUnsuccessfulPage,
    renderIdNotFoundPage,
    renderSuccessfulPage,
    renderStartingPage,
    renderRawUrlPage
}