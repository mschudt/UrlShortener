const fs = require("fs");
const path = require("path");
const Config = require("./config");

const loadSourceFile = (filename) => {
    // build filepath and read in file as a string synchronously
    return fs.readFileSync(path.join(__dirname, "static", "html", filename), {encoding: "utf8"});
}

// load html chunks into RAM to eliminate disk reads on each request
const topHtml = loadSourceFile("top.html");
const bottomHtml = loadSourceFile("bottom.html");

const renderUnsuccessfulPage = () => {
    return topHtml
        + `<p>Please enter a valid URL!</p>`
        + bottomHtml;
}

const renderIdNotFoundPage = () => {
    return topHtml
        + `<p>I'm sorry. We could not find that URL.</p>`
        + `<p>Enter a new URL to shorten</p>`
        + bottomHtml;
}

const renderSuccessfulPage = (createdId) => {
    const shortenedUrl = Config.HOSTNAME + createdId;
    return topHtml
        + `<p>Successfully created shortend link</p><div><input type="text" size="${shortenedUrl.length - 5}ch" value="${shortenedUrl}"/></div><br/>`
        + `<p>Shorten another URL</p>`
        + bottomHtml;
}

const renderStartingPage = () => {
    return topHtml
        + `<p>Please enter a URL to shorten</p>`
        + bottomHtml;
}

const renderRawUrlPage = (resolvedUrl) => {
    return topHtml
        + `<p>You will be redirected to the following URL</p>`
        + `<p><input type="text" size="${resolvedUrl.length - 5}ch" value="${resolvedUrl}"/></p>`
        + `<p><a href="${resolvedUrl}"><input id="redirectBtn" type="button" value="Redirect"/></a></p>`;
}

module.exports = {
    renderUnsuccessfulPage,
    renderIdNotFoundPage,
    renderSuccessfulPage,
    renderStartingPage,
    renderRawUrlPage
}