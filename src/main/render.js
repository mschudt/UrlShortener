import fs from "fs";
import path from "path";
import * as Config from "./config";

export const loadSourceFile = (filename) => {
    // build filepath and read in file as a string synchronously
    return fs.readFileSync(path.join(__dirname, "static", "html", filename), {encoding: "utf8"});
}

// HTML chunks that are reused on the url shortener pages
export const topHtml = loadSourceFile("top.html");

export const bottomHtml = loadSourceFile("bottom.html");

export const renderUnsuccessfulPage = () => {
    return topHtml
        + `<p>Please enter a valid URL!</p>`
        + bottomHtml;
}

export const renderIdNotFoundPage = () => {
    return topHtml
        + `<p>I'm sorry. We could not find that URL.</p>`
        + `<p>Enter a new URL to shorten</p>`
        + bottomHtml;
}

export const renderSuccessfulPage = (createdId) => {
    const shortenedUrl = Config.HOSTNAME + createdId;
    return topHtml
        + `<p>Successfully created shortend link</p><div><input type="text" style="width: ${shortenedUrl.length}ch; max-width: 80%;" value="${shortenedUrl}"/></div>`
        + `<p>Shorten another URL</p>`
        + bottomHtml;
}

export const renderStartingPage = () => {
    return topHtml
        + `<a href="/text" style="position: absolute; left: 14px; top: 28px;">Text uploader</a>`
        + `<h1>shr.gg - URL shortener</h1>`
        + `<p>Please enter a URL to shorten</p>`
        + bottomHtml;
}
export const renderRawUrlPage = (resolvedUrl, shortenedUrlId, removeAfterRedirect) => {
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
