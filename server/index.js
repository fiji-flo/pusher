const https = require('https');
const express = require('express');
const pusher = require("./pusher.js");
const fs = require('fs');

const PORT = 8080;

const privateKey = fs.readFileSync('cert/server.key');
const certificate = fs.readFileSync('cert/server.crt');

const credentials = { key: privateKey, cert: certificate };
const app = express();
app.use(express.static('../webapp'));

app.post("/push", pusher.pushHandler);

https.createServer(credentials, app).listen(PORT, function () {
  console.log('up and running')
})