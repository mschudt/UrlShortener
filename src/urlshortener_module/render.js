import fs from "fs";
import path from "path";
import * as Config from "./config";

const loadSourceFile = (filename) => {
    // build filepath and read in file as a string synchronously
    return fs.readFileSync(path.join(__dirname, "static", "html", filename), {encoding: "utf8"});
}

// HTML chunks that are reused on the url shortener pages
const topHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>URL shortener</title>
    <link rel="stylesheet" type="text/css" href="/css/styles.css">
    <link rel="icon" type="icon" href="/favicon.ico">
</head>
<body>
<div id="mainDiv">`;

const bottomHtml = `<form action="/create" method="GET">
    <input id="contentInput" name="url" type="text"/>
    <div class="spacerDiv">
        <label for="removeAfterDropdownMenu">Burn after</label>
        <select id="removeAfterDropdownMenu" name="removeAfter">
            <option value="2">2 minutes</option>
            <option value="5">5 minutes</option>
            <option value="10">10 minutes</option>
            <option value="30">30 minutes</option>
        </select>
    </div>
    <div class="spacerDiv">
        <input checked class="switch" id="removeAfterRedirectCheckbox" name="removeAfterRedirect" type="checkbox"
               value="true">
        <label id="removeAfterRedirectCheckboxLabel" for="removeAfterRedirectCheckbox">Remove link after
            redirecting</label>
    </div>
</form>
</div>
</body>
</html>`;

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
        + `<p>Successfully created shortend link</p><div><input type="text" style="width: ${shortenedUrl.length}ch; max-width: 80%;" value="${shortenedUrl}"/></div>`
        + `<p>Shorten another URL</p>`
        + bottomHtml;
}

const renderStartingPage = () => {
    return topHtml
        + `<p>Please enter a URL to shorten</p>`
        + bottomHtml;
}

const renderRawUrlPage = (resolvedUrl, shortenedUrlId, removeAfterRedirect) => {
    let href;
    // If the link should be removed after a redirect, we have to put the shortened url as the <a>'s href attribute.
    // This is because otherwise we cannot (without using additional JavaScript) send a message to the server
    // signalizing that the link should be deleted.
    if (removeAfterRedirect) {
        href = Config.HOSTNAME + shortenedUrlId;

    } else {
        // If the link should only be removed after the timeout has been reached, we can input the unshortened version
        // as the href attribute
        href = resolvedUrl;
    }

    return topHtml
        + `<p>You will be redirected to the following URL</p>`
        + `<p><input type="text" style="width: 80%; max-width: 600px;" value="${resolvedUrl}"/></p>`
        + `<a href="${href}"><input class="button" type="button" value="Redirect"/></a>`;
}

module.exports = {
    renderUnsuccessfulPage,
    renderIdNotFoundPage,
    renderSuccessfulPage,
    renderStartingPage,
    renderRawUrlPage,

    loadSourceFile
}