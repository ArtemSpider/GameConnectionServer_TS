import WebSocket from "ws";
import express from "express";
import http from "http";
import fs from "fs";

const app = express();

const server = http.createServer(app);

app.post('/test', (req, res) => {
    res.send('')
})

const localPort = "1337";
const port = process.env.PORT || localPort;
server.listen(port);

if (port == localPort) {
    console.log("Server running at http://localhost:" + port);
}