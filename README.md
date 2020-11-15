## About
This is a basic implementation of an URL shortener that deletes shortened URLs
after X minutes or one redirection. Version 2.0 also allows text upload.

URL shortening @ [shr.gg](https://shr.gg)

Text uploading @ [shr.gg/text](https://shr.gg/text)

## Built With

* [Node](https://nodejs.org/)
* [Express.js](https://expressjs.com/)


## Installation
1. Clone the repo
```sh
git clone https://github.com/mschudt/UrlShortener.git
```
2. Install NPM packages
```sh
npm install
```
3. Start the server
```sh
npm start http://localhost 3001
```

## Deployment
I suggest getting a free HTTPS certificate from [Let's Encrypt](https://letsencrypt.org/)
and setting up an [NGINX Reverse Proxy](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/)
to handle TLS and redirect port 80 and 443 to this applications port (3001 by default).