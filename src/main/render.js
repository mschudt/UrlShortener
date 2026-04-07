import fs from "fs";
import path from "path";
import escape from "escape-html";
import * as Config from "./config";

export const loadSourceFile = (filename) => {
    // build filepath and read in file as a string synchronously
    return fs.readFileSync(path.join(__dirname, "static", "html", filename), {encoding: "utf8"});
}

// HTML chunks that are reused on the url shortener pages
export const topHtml = loadSourceFile("top.html");

export const bottomHtml = loadSourceFile("bottom.html");

const closingHtml = `</div></body></html>`;

export const renderBackToTextUploaderButton = () => {
    return `<p><a href="/text"><input class="button" style="width: 25ch;" type="button" value="Go back to text uploader"/></a></p>`;
}

export const renderBackToUrlShortenerButton = () => {
    return `<p><a href="/"><input class="button" style="width: 25ch;" type="button" value="Go back to URL shortener"/></a></p>`;
}

export const renderTextUploaderLink = () => {
    return `<a id="navLink" href="/text">Text uploader</a>`;
}

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

const renderShortenedUrlResult = (createdId) => {
    const shortenedUrl = Config.HOSTNAME + createdId;
    return `<div class="shortenedUrlRow">`
        + `<input id="shortenedUrlInput" class="shortenedUrlInput" type="text" readonly style="width: ${shortenedUrl.length}ch;" value="${escape(shortenedUrl)}"/>`
        + `<input id="copyButton" class="button" type="button" value="Copy"/>`
        + `</div>`;
}

export const renderSuccessfulPage = (createdId) => {
    return topHtml
        + renderTextUploaderLink()
        + `<p>Successfully created shortened link</p>`
        + renderShortenedUrlResult(createdId)
        + renderBackToUrlShortenerButton()
        + closingHtml;
}

export const renderTextSuccessfulPage = (createdId) => {
    return topHtml
        + `<p>Successfully created shortened link</p>`
        + renderShortenedUrlResult(createdId)
        + renderBackToTextUploaderButton()
        + closingHtml;
}

export const renderStartingPage = () => {
    return topHtml
        + renderTextUploaderLink()
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
        href = Config.HOSTNAME + shortenedUrlId + "/use";

    } else {
        // If the link should only be removed after the timeout has been reached, we can input the unshortened version
        // as the href attribute
        href = resolvedUrl;
    }

    return topHtml
        + `<p>You will be redirected to the following URL</p>`
        + `<p><input type="text" style="width: 80%; max-width: 600px;" value="${escape(resolvedUrl)}"/></p>`
        + `<a href="${escape(href)}"><input class="button" type="button" value="Redirect"/></a>`;
}
