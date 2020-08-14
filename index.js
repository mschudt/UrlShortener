const fastify = require("fastify")();
const path = require("path");
const Config = require("./config");
const HtmlRenderer = require("./render");

const start = async () => {
    try {
        await fastify.listen(Config.PORT, "0.0.0.0");
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fastify.register(require('fastify-static'), {
    root: path.join(__dirname)
})


const idToUrlObjectsMap = {};

const cleanupUrls = () => {
    let counter = 0;
    for (const [id, urlObj] of Object.entries(idToUrlObjectsMap)) {
        if (Date.now() - urlObj.createdAt >= Config.ID_LIFETIME) {
            delete idToUrlObjectsMap[id];
            counter++;
        }
    }
}


fastify.get("/create", (request, reply) => {
    const url = request.query.url;
    reply.type("text/html");
    // check if the url was valid
    if (url === undefined || !(url.startsWith("http://") || url.startsWith("https://"))) {
        reply.send(HtmlRenderer.renderUnsuccessfulPage());
        return;
    }

    // generate random string of wanted id length
    const randomId = Math.random().toString(36).substring(Config.ID_LENGTH + 3);
    // save id -> url object relation in map
    idToUrlObjectsMap[randomId] = {url: request.query.url, createdAt: Date.now()};

    reply.send(HtmlRenderer.renderSuccessfulPage(randomId));
});

// try redirect if an url id was passed
fastify.get("/:id", (request, reply) => {
        if (idToUrlObjectsMap[request.params.id] === undefined) {
            // render the invalid id page if the id was not found
            reply.type("text/html").send(HtmlRenderer.renderIdNotFoundPage());
        } else {
            // redirect to target page if it was found
            reply.redirect(idToUrlObjectsMap[request.params.id].url);
            // delete id -> url relation after a successful redirect
            delete idToUrlObjectsMap[request.params.id];
        }
    }
);

// show start page if no url id was passed
fastify.get("/", (request, reply) => {
    reply.type("text/html");
    reply.send(HtmlRenderer.renderStartingPage());
});

// register url cleanup timer that deletes urls
// run that check every 3 seconds
setInterval(cleanupUrls, 5 * 1000);

// start fastify application server
start();
