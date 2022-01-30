"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
app.post('/test', (req, res) => {
    res.send('');
});
const localPort = "1337";
const port = process.env.PORT || localPort;
server.listen(port);
if (port == localPort) {
    console.log("Server running at http://localhost:" + port);
}
