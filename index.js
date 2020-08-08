const fastify = require("fastify")();
const path = require("path");
const fs = require("fs");

const start = async () => {
    try {
        await fastify.listen(3001, "0.0.0.0");
    } catch (err) {
        console.log(err);
        process.exit(1);
    }
}

fastify.register(require('fastify-static'), {
    root: path.join(__dirname)
})

const URL_PREFIX = "http://localhost:3001/"
const ID_LENGTH = 5;
const ID_LIFETIME = 2 * 60 * 1000; // delete saved urls after that many milliseconds
const idToUrlObjectsMap = {};

const cleanupUrls = () => {
    let counter = 0;
    for (const [id, urlObj] of Object.entries(idToUrlObjectsMap)) {
        console.log(urlObj);
        if (Date.now() - urlObj.createdAt >= ID_LIFETIME) {
            delete idToUrlObjectsMap[id];
            counter++;
        }
    }
    console.log("Cleaned up " + counter + " urls.")
}

const tryRedirectionToUrlWithId = (request, reply) => {
    if (idToUrlObjectsMap[request.params.id] === undefined) {
        // render the invalid id page if the id was not found
        reply.type("text/html").send(renderIdNotFoundPage());
    } else {
        // redirect to target page if it was found
        reply.redirect(idToUrlObjectsMap[request.params.id].url);
        // delete id -> url relation after a successful redirect
        delete idToUrlObjectsMap[request.params.id];
    }
}

const loadSourceFile = (filename) => {
    // build filepath and read in file as a file synchronously
    return fs.readFileSync(path.join(__dirname, filename), {encoding: "utf8"});
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

fastify.get("/create", (request, reply) => {
    const url = request.query.url;
    reply.type("text/html");
    // check if the url was valid
    if (url === undefined || !(url.startsWith("http://") || url.startsWith("https://"))) {
        reply.send(renderUnsuccessfulPage());
        return;
    }

    // generate random string of wanted id length
    const randomId = Math.random().toString(36).substring(ID_LENGTH + 3);
    // save id -> url object relation in map
    idToUrlObjectsMap[randomId] = {url: request.query.url, createdAt: Date.now()};

    reply.send(renderSuccessfulPage(randomId));
});

// when an url id was passed
fastify.get("/:id", tryRedirectionToUrlWithId);

// show start page if no url id was passed
fastify.get("/", (request, reply) => {
    reply.type("text/html");
    reply.send(renderStartingPage());
});

// fastify.post("/", (request, reply) => {
//     reply.type("text/html");
//     console.log(request.params);
//
//     if (request.params.newId === undefined) {
//         console.log("no newId passed");
//         reply.send(renderStartingPage());
//
//     } else {
//         console.log("newId passed: " + request.params.newId);
//         reply.send(renderSuccessfulPage(request.params.newId));
//     }
//
// });

// register url cleanup timer that deletes urls
// run that check every 3 seconds
setInterval(cleanupUrls, 5 * 1000);
// start fastify application server
start();
