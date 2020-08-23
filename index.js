const express = require("express");
const helmet = require("helmet");
const path = require("path");

const Config = require("./config");
const HtmlRenderer = require("./render");

const app = express();

const idToUrlObjectsMap = {};

const cleanupUrls = () => {
    const currentMillis = Date.now();
    let counter = 0;
    for (const [id, urlObj] of Object.entries(idToUrlObjectsMap)) {
        if (currentMillis - urlObj.createdAt >= urlObj.removeAfter) {
            delete idToUrlObjectsMap[id];
            counter++;
        }
    }
}

// serve static files in the /static directory
// mainly html and css files
app.use(express.static("static"));

// secure express aganst a lot of common vunerabilities
app.use(helmet());

app.get("/create", (req, res) => {
    const url = req.query.url;
    const removeAfter = parseInt(req.query.removeAfter);

    res.set("Content-Type", "text/html");
    // check if the url was valid
    if (url === undefined || !(url.startsWith("http://") || url.startsWith("https://"))) {
        res.send(HtmlRenderer.renderUnsuccessfulPage());
        return;
        // check if removeAfter parameter was set and is a valid number
    } else if (!Config.ID_LIFETIMES.includes(removeAfter)) {
        res.send(HtmlRenderer.renderUnsuccessfulPage());
        return;
    }

    // generate random string of wanted id length
    const randomId = Math.random().toString(36).substring(2, Config.ID_LENGTH + 1);
    // save id -> url object relation in map
    // removeAfter is passed to the backend in minutes so we have to convert it to millis
    // to compare with the current time later
    idToUrlObjectsMap[randomId] = {url: req.query.url, createdAt: Date.now(), removeAfter: removeAfter * 60 * 1000};

    res.send(HtmlRenderer.renderSuccessfulPage(randomId));
});

// try redirect if an url id was passed
app.get("/:id", (req, res) => {
        if (idToUrlObjectsMap[req.params.id] === undefined) {
            // render the invalid id page if the id was not found
            res.set("Content-Type", "text/html");
            res.send(HtmlRenderer.renderIdNotFoundPage());
        } else {
            // redirect to target page if it was found
            res.redirect(idToUrlObjectsMap[req.params.id].url);
            // delete id -> url relation after a successful redirect
            delete idToUrlObjectsMap[req.params.id];
        }
    }
);

app.get("/:id/raw", (req, res) => {
    if (idToUrlObjectsMap[req.params.id] === undefined) {
        // render the invalid id page if the id was not found
        res.set("Content-Type", "text/html");
        res.send(HtmlRenderer.renderIdNotFoundPage());

    } else {
        const resolvedUrl = idToUrlObjectsMap[req.params.id].url;
        res.set("Content-Type", "text/html");
        res.send(HtmlRenderer.renderRawUrlPage(resolvedUrl));
    }
});

// show start page if no url id was passed
app.get("/", (req, res) => {
    res.set("Content-Type", "text/html");
    res.send(HtmlRenderer.renderStartingPage());
})

// register url cleanup timer that deletes urls
// run that check every 3 seconds
setInterval(cleanupUrls, 5 * 1000);

// start express application server
app.listen(Config.PORT, () => {
    console.log(`Express server listing on port ${Config.PORT}`);
});