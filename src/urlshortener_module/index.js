import express from "express";
import helmet from "helmet";
import path from "path";
import * as Config from "./config";
import * as HtmlRenderer from "./render";
import {StorageModule, DatabaseAccessor} from "../storage_module";

const storageModule = new StorageModule(new DatabaseAccessor());
storageModule.startGarbageCollection(10);

const app = express();

// Serve static files in the /static directory
// Mainly html and css files
app.use(express.static("static"));

// Secure express aganst a lot of common vunerabilities
app.use(helmet());

app.get("/create", (req, res) => {
    const url = req.query.url;
    const removeAfter = parseInt(req.query.removeAfter);

    res.set("Content-Type", "text/html");
    // Check if the url was valid
    if (url === undefined || !(url.startsWith("http://") || url.startsWith("https://"))) {
        res.send(HtmlRenderer.renderUnsuccessfulPage());
        return;
        // Check if removeAfter parameter was set and is a valid number
    } else if (!Config.ID_LIFETIMES.includes(removeAfter)) {
        res.send(HtmlRenderer.renderUnsuccessfulPage());
        return;
    }

    // If the removeAfterRedirect checkbox was checked the link will be removed
    // after one successful redirect. If not, the link will stay until its timeout is reached.
    let removeAfterRedirect = false;
    if (req.query.removeAfterRedirect === "true") {
        removeAfterRedirect = true;
    }

    // Generate random string of wanted id length
    const randomId = Math.random().toString(36).substring(2, Config.ID_LENGTH + 1);
    // Save id -> url object relation in map
    // removeAfter is passed to the backend in minutes so we have to convert it to millis
    // to compare with the current time later
    storageModule.store(randomId, req.query.url, removeAfter * 60 * 1000, removeAfterRedirect);

    res.send(HtmlRenderer.renderSuccessfulPage(randomId));
});

// Try redirect if an url id was passed
app.get("/:id", (req, res) => {
        // Url object with the passed id
        const storedObject = storageModule.fetch(req.params.id);
        if (storedObject === undefined) {
            // Render the invalid id page if the id was not found
            res.set("Content-Type", "text/html");
            res.send(HtmlRenderer.renderIdNotFoundPage());
        } else {
            // Redirect to target page if it was found
            res.redirect(storedObject.content);

            // If the removeAftereRedirect boolean is set, the url will be removed after one successful redirect.
            if (storedObject.destroyAfterUse) {
                storageModule.remove(req.params.id);
            }
        }
    }
);

app.get("/:id/raw", (req, res) => {
    // Url object with the passed id
    const storedObject = storageModule.fetch(req.params.id);

    if (storedObject === undefined) {
        // Render the invalid id page if the id was not found
        res.set("Content-Type", "text/html");
        res.send(HtmlRenderer.renderIdNotFoundPage());

    } else {
        const resolvedUrl = storedObject.content;
        res.set("Content-Type", "text/html");
        res.send(HtmlRenderer.renderRawUrlPage(resolvedUrl, req.params.id, storedObject.destroyAfterUse));
    }
});

// Show start page if no url id was passed
app.get("/", (req, res) => {
    res.set("Content-Type", "text/html");
    res.send(HtmlRenderer.renderStartingPage());
})

// Start express application server
app.listen(Config.PORT, () => {
    console.log(`Express server listing on port ${Config.PORT}`);
});