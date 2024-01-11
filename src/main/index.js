import express from "express";
import helmet from "helmet";
import escape from "escape-html";
import * as Config from "./config";
import * as HtmlRenderer from "./render";
import {StorageModule, DatabaseAccessor} from "../storage";
import {StoredType, generateNewIdAsRandomWord} from "./util";
import {topHtml, bottomHtml} from "./render";

const storageModule = new StorageModule(new DatabaseAccessor());
storageModule.startGarbageCollection(10);

const app = express();

// Serve static files in the /static directory
// Mainly html and css files
app.use(express.static("src/main/static"));

// Secure express aganst a lot of common vunerabilities
app.use(helmet());

// Make request post parameters accessible
app.use(express.urlencoded({limit: "50mb", extended: true}));

// visiter count since restart is the only anonymized usage data shr.gg tracks
let urlShortenerVisitsCounter = 0;
let textUploaderVisitsCounter = 0;

app.get("/create", (req, res) => {
    const url = req.query.url;
    const removeAfter = parseInt(req.query.removeAfter);

    res.set("Content-Type", "text/html");
    // Check if the url was valid
    if (url === undefined || !(url.startsWith("http://") || url.startsWith("https://"))) {
        res.send(HtmlRenderer.renderUnsuccessfulPage());
        return;
        // Check if removeAfter parameter was set and is a valid number
    } else if (!Config.LIFETIMES.includes(removeAfter)) {
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
    const randomId = generateNewIdAsRandomWord(Config.ID_LENGTH);

    // Save id -> url object relation in map
    // removeAfter is passed to the backend in minutes so we have to convert it to millis
    // to compare with the current time later
    storageModule.store(randomId, req.query.url, StoredType.URL, removeAfter * 60 * 1000, removeAfterRedirect);

    res.send(HtmlRenderer.renderSuccessfulPage(randomId));
});

app.post("/text/create", (req, res) => {
    const content = req.body.content;
    const removeAfter = parseInt(req.body.removeAfter);

    res.set("Content-Type", "text/html");

    // Check if the content parameter was passed
    if (content === undefined) {
        res.send(topHtml + `<p>Invalid input!</p>` + bottomHtml);
        return;
        // Check if removeAfter parameter was set and is a valid number
    } else if (!Config.LIFETIMES.includes(removeAfter)) {
        res.send(topHtml + `<p>Invalid input!</p>` + bottomHtml);
        return;
    }

    // If the removeAfterRedirect checkbox was checked the link will be removed
    // after one successful redirect. If not, the link will stay until its timeout is reached.
    let removeAfterOpening = false;
    if (req.body.removeAfterRedirect === "true") {
        removeAfterOpening = true;
    }

    // Generate random string of wanted id length
    const randomId = generateNewIdAsRandomWord(Config.ID_LENGTH);

    // Save id -> url object relation in map
    // removeAfter is passed to the backend in minutes so we have to convert it to millis
    // to compare with the current time later
    storageModule.store("text/" + randomId, content, StoredType.Text, removeAfter * 60 * 1000, removeAfterOpening);

    res.send(HtmlRenderer.renderSuccessfulPage("text/" + randomId));
})

app.get("/text/:id", (req, res) => {
    const id = "text/" + req.params.id;

    // Url object with the passed id
    const storedObject = storageModule.fetch(id);
    if (storedObject === undefined) {
        // Render the invalid id page if the id was not found
        res.set("Content-Type", "text/html");
        res.send(HtmlRenderer.renderIdNotFoundPage());
    } else {
        // Redirect to target page if it was found
        res.send(
            topHtml +
            `<textarea id="contentInputTextarea">${escape(storedObject.content)}</textarea>`
            + `</body>
               </html>`
        );

        // If the removeAftereRedirect boolean is set, the url will be removed after one successful redirect.
        if (storedObject.destroyAfterUse) {
            storageModule.remove(id);
        }
    }
})

app.get("/text", (req, res) => {
    textUploaderVisitsCounter += 1;
    console.log("/text visits: " + textUploaderVisitsCounter);

    res.set("Content-Type", "text/html");

    // The bottomHtml of the text shortener differs from the url shortener
    const bottomHtml = `<form action="/text/create" method="POST">
    <textarea id="contentInputTextarea" name="content"></textarea>
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
    <div class="spacerDiv">
        <input class="button" id="submitButton" type="submit" value="Submit"/>
    </div>
    </form>
    </div>
    </body>
    </html>`;

    res.send(
        topHtml
        + `<a id="navLink" href="/">URL shortener</a>`
        + `<h1>shr.gg - Text uploader</h1>`
        + `<p>Please enter your text</p>`
        + bottomHtml
    );
})


// Try redirect if an url id was passed
app.get("/:id", (req, res) => {
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
    }
);

app.get("/:id/use", (req, res) => {
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
});

// Show start page if no url id was passed
app.get("/", (req, res) => {
    urlShortenerVisitsCounter += 1;
    console.log("/ visits: " + urlShortenerVisitsCounter);

    res.set("Content-Type", "text/html");
    res.send(HtmlRenderer.renderStartingPage());
})

// Start express application server
app.listen(Config.PORT, () => {
    console.log(`Express server listing on port ${Config.PORT}`);
});
