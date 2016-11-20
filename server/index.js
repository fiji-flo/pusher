'use strict';
// use something like http-proxy for https
const http = require('http');
const express = require('express');
const pusher = require('./pusher.js');
const fs = require('fs');
const bodyParser = require('body-parser');

const PORT = 8080;

const app = express();
app.use(express.static('../webapp'));
app.use(bodyParser.json());

app.post('/push', pusher.pushHandler);

http.createServer(app).listen(PORT, function () {
  console.log('up and running')
})
