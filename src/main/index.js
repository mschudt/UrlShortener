import express from "express";
import helmet from "helmet";
import escape from "escape-html";
import * as Config from "./config";
import * as HtmlRenderer from "./render";
import {StorageModule, DatabaseAccessor, StoreResult} from "../storage";
import {StoredType, generateNewIdAsRandomWord} from "./util";
import {topHtml} from "./render";

const storageModule = new StorageModule(new DatabaseAccessor({
    maxEntries: Config.MAX_STORED_ENTRIES,
    maxBytes: Config.MAX_STORED_BYTES,
}));
storageModule.startGarbageCollection(10);

const app = express();

// Apply security headers to every response, including static assets.
app.use(helmet());

// Serve static files in the /static directory
// Mainly html and css files
app.use(express.static("src/main/static"));

const parseForm = express.urlencoded({
    limit: Config.FORM_BODY_LIMIT,
    extended: false,
    parameterLimit: 10,
});

const noStore = (req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
}

const noIndex = (req, res, next) => {
    res.set("X-Robots-Tag", "noindex, noarchive");
    next();
}

const privatePage = [noStore, noIndex];

const parseLifetime = value => {
    if (typeof value !== "string" || !Config.LIFETIMES.some(lifetime => String(lifetime) === value)) {
        return undefined;
    }

    return Number(value);
}

const isValidDestroyAfterUse = value => value === undefined || value === "true";

const absoluteHttpUrlPattern = /^https?:\/\/[^/?#\\]+(?:[/?#]|$)/i;
const invalidRawUrlCharacterPattern = /[\s\\\u0000-\u001f\u007f]/;

const parseDestinationUrl = value => {
    if (
        typeof value !== "string"
        || !absoluteHttpUrlPattern.test(value)
        || invalidRawUrlCharacterPattern.test(value)
    ) {
        return undefined;
    }

    let parsedUrl;
    try {
        parsedUrl = new URL(value);
    } catch {
        return undefined;
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol) || parsedUrl.hostname === "") {
        return undefined;
    }
    if (parsedUrl.username !== "" || parsedUrl.password !== "") {
        return undefined;
    }

    return parsedUrl.href;
}

const securityEventCounters = {
    payloadTooLarge: 0,
    rateLimited: 0,
    storageFull: 0,
};

const securityEventLogIntervalMillis = 60 * 1000;
let securityEventCountersChanged = false;

const recordSecurityEvent = event => {
    securityEventCounters[event] += 1;
    securityEventCountersChanged = true;
}

const securityEventLogTimer = setInterval(() => {
    if (!securityEventCountersChanged) {
        return;
    }
    securityEventCountersChanged = false;

    console.log(
        `rejections: 413=${securityEventCounters.payloadTooLarge} `
        + `429=${securityEventCounters.rateLimited} `
        + `storage-full=${securityEventCounters.storageFull}`
    );
}, securityEventLogIntervalMillis);
securityEventLogTimer.unref();

const storeWithGeneratedId = (prefix, content, type, lifetime, destroyAfterUse) => {
    while (true) {
        const randomId = generateNewIdAsRandomWord(
            Config.ID_LENGTH,
            candidate => storageModule.has(prefix + candidate)
        );
        const result = storageModule.store(
            prefix + randomId,
            content,
            type,
            lifetime,
            destroyAfterUse
        );

        if (result === StoreResult.STORED) {
            return {result, randomId};
        }
        if (result === StoreResult.CAPACITY) {
            return {result};
        }
    }
}

const sendStorageFull = res => {
    recordSecurityEvent("storageFull");
    res.set("Retry-After", String(Config.STORAGE_FULL_RETRY_SECONDS));
    res.type("html");
    res.status(503).send(HtmlRenderer.renderServiceUnavailablePage());
}

const sendPayloadTooLarge = res => {
    recordSecurityEvent("payloadTooLarge");
    res.type("html");
    res.status(413).send(HtmlRenderer.renderPayloadTooLargePage());
}

// Visitor count since restart is the only anonymized usage data shr.gg tracks.
let urlShortenerVisitsCounter = 0;
let textUploaderVisitsCounter = 0;

app.get("/create", privatePage, (req, res) => {
    const query = req.query || {};
    const url = parseDestinationUrl(query.url);
    const removeAfter = parseLifetime(query.removeAfter);

    res.type("html");
    // Check if the url was valid
    if (url === undefined) {
        res.status(400).send(HtmlRenderer.renderUnsuccessfulPage());
        return;
        // Check if removeAfter parameter was set and is a valid number
    } else if (removeAfter === undefined || !isValidDestroyAfterUse(query.removeAfterRedirect)) {
        res.status(400).send(HtmlRenderer.renderUnsuccessfulPage());
        return;
    } else if (Buffer.byteLength(url, "utf8") > Config.MAX_URL_BYTES) {
        sendPayloadTooLarge(res);
        return;
    }

    // If the removeAfterRedirect checkbox was checked the link will be removed
    // after one successful redirect. If not, the link will stay until its timeout is reached.
    const removeAfterRedirect = query.removeAfterRedirect === "true";

    const stored = storeWithGeneratedId(
        "",
        url,
        StoredType.URL,
        removeAfter * 60 * 1000,
        removeAfterRedirect
    );
    if (stored.result === StoreResult.CAPACITY) {
        sendStorageFull(res);
        return;
    }
    const randomId = stored.randomId;

    console.log(`/create ${randomId}`);

    res.send(HtmlRenderer.renderSuccessfulPage(randomId));
});

app.post("/text/create", privatePage, parseForm, (req, res) => {
    const body = req.body || {};
    const content = body.content;
    const removeAfter = parseLifetime(body.removeAfter);

    res.type("html");

    // Check if the content parameter was passed
    if (typeof content !== "string") {
        res.status(400).send(HtmlRenderer.renderInvalidInputPage());
        return;
        // Check if removeAfter parameter was set and is a valid number
    } else if (removeAfter === undefined || !isValidDestroyAfterUse(body.removeAfterRedirect)) {
        res.status(400).send(HtmlRenderer.renderInvalidInputPage());
        return;
    } else if (Buffer.byteLength(content, "utf8") > Config.MAX_TEXT_BYTES) {
        sendPayloadTooLarge(res);
        return;
    }

    // If the removeAfterRedirect checkbox was checked the link will be removed
    // after one successful redirect. If not, the link will stay until its timeout is reached.
    const removeAfterOpening = body.removeAfterRedirect === "true";

    const stored = storeWithGeneratedId(
        "text/",
        content,
        StoredType.Text,
        removeAfter * 60 * 1000,
        removeAfterOpening
    );
    if (stored.result === StoreResult.CAPACITY) {
        sendStorageFull(res);
        return;
    }
    const randomId = stored.randomId;

    res.send(HtmlRenderer.renderTextSuccessfulPage("text/" + randomId));
})

app.get("/text/create", privatePage, (req, res) => {
    res.set("Allow", "POST").sendStatus(405);
});

app.head("/text/:id", privatePage, (req, res) => {
    res.set("Allow", "GET").sendStatus(405);
});

app.get("/text/:id", privatePage, (req, res) => {
    const id = "text/" + req.params.id;

    // Url object with the passed id
    const storedObject = storageModule.fetch(id);
    if (storedObject === undefined) {
        // Render the invalid id page if the id was not found
        res.type("html");
        res.status(404).send(HtmlRenderer.renderIdNotFoundPage());
    } else {
        // Redirect to target page if it was found
        res.send(
            topHtml +
            `<textarea id="contentInputTextarea">${escape(storedObject.content)}</textarea>`
            + HtmlRenderer.renderBackToTextUploaderButton()
            + `</body>
               </html>`
        );

        // If destroyAfterUse is set, the text will be removed after one successful opening.
        if (storedObject.destroyAfterUse) {
            storageModule.remove(id);
        }
    }
})

app.get("/text", noIndex, (req, res) => {
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
        + HtmlRenderer.renderUrlShortenerLink()
        + `<h1>shr.gg - Text uploader</h1>`
        + `<p>Please enter your text</p>`
        + bottomHtml
    );
})


// Try redirect if an url id was passed
app.get("/:id", privatePage, (req, res) => {
        // Url object with the passed id
        const storedObject = storageModule.fetch(req.params.id);

        if (storedObject === undefined) {
            // Render the invalid id page if the id was not found
            res.type("html");
            res.status(404).send(HtmlRenderer.renderIdNotFoundPage());
        } else {
            const resolvedUrl = storedObject.content;
            res.set("Content-Type", "text/html");
            res.send(HtmlRenderer.renderRawUrlPage(resolvedUrl, req.params.id, storedObject.destroyAfterUse));
        }
    }
);

app.head("/:id/use", privatePage, (req, res) => {
    res.set("Allow", "GET").sendStatus(405);
});

app.get("/:id/use", privatePage, (req, res) => {
    // Url object with the passed id
    const storedObject = storageModule.fetch(req.params.id);
    if (storedObject === undefined) {
        // Render the invalid id page if the id was not found
        res.type("html");
        res.status(404).send(HtmlRenderer.renderIdNotFoundPage());
    } else {
        // Redirect to target page if it was found
        res.redirect(storedObject.content);

        // If destroyAfterUse is set, the URL will be removed after one successful redirect.
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

app.use((error, req, res, next) => {
    if (error.status === 413) {
        res.set("Cache-Control", "no-store");
        res.type("html");
        sendPayloadTooLarge(res);
        return;
    }

    next(error);
});

// Start express application server
app.listen(Config.PORT, "127.0.0.1", () => {
    console.log(`Express server listing on port ${Config.PORT}`);
});
