"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
//import fs from "fs";
function getRandomInt() {
    return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
}
function removeItem(arr, value) {
    const index = arr.indexOf(value);
    if (index > -1) {
        arr.splice(index, 1);
    }
    return arr;
}
class Error {
    constructor(id, info) {
        this.id = id;
        this.info = info;
    }
    description() {
        switch (this.id) {
            case ERROR_WRONG_QUERY: return "wrong query";
            case ERROR_IN_DEVELOPMENT: return "still in development";
            case ERROR_UNKNOWN_ID: return "unknown id";
            case ERROR_WRONG_STATE: return "wrong state";
        }
        return "undefined";
    }
}
const ERROR_WRONG_QUERY = 100;
const ERROR_IN_DEVELOPMENT = 150;
const ERROR_UNKNOWN_ID = 200;
const ERROR_WRONG_STATE = 201;
var PlayerState;
(function (PlayerState) {
    PlayerState[PlayerState["Registration"] = 0] = "Registration";
    PlayerState[PlayerState["Idle"] = 1] = "Idle";
    PlayerState[PlayerState["Searching"] = 2] = "Searching";
    PlayerState[PlayerState["Playing"] = 3] = "Playing";
})(PlayerState || (PlayerState = {}));
class Game {
    constructor(id1, id2) {
        this.id1 = id1;
        this.id2 = id2;
    }
    other(id) {
        return id == this.id1 ? this.id2 : this.id1;
    }
}
class Player {
    constructor(nickname) {
        this.state = PlayerState.Idle;
        this.nickname = nickname;
        this.id = getRandomInt();
        this.playerId = getRandomInt();
        this.sentRequests = new Set();
        this.recievedRequests = new Set();
        this.recievedMessages = new Array();
        this.currentGame = undefined;
    }
}
class Logic {
    constructor() {
        this.allPlayers = new Map();
        this.ids = new Map();
        this.playersInSearch = new Array();
    }
    getPrivateID(id) {
        let pid = this.ids.get(id);
        if (pid === undefined) {
            return new Error(ERROR_UNKNOWN_ID);
        }
        else {
            return pid;
        }
    }
    has(id) {
        return this.allPlayers.has(id);
    }
    getPlayer(id) {
        let player = this.allPlayers.get(id);
        if (player === undefined) {
            return new Error(ERROR_UNKNOWN_ID);
        }
        else {
            return player;
        }
    }
    getState(id) {
        let player = this.allPlayers.get(id);
        if (player === undefined) {
            return new Error(ERROR_UNKNOWN_ID);
        }
        else {
            return player.state;
        }
    }
    register(nickname) {
        let player = new Player(nickname);
        this.allPlayers.set(player.id, player);
        this.ids.set(player.playerId, player.id);
        return player;
    }
    removePlayer(id) {
        let player = this.getPlayer(id);
        if (player instanceof Error) {
            return player;
        }
        if (player.state === PlayerState.Playing) {
            this.endGame(id);
        }
        removeItem(this.playersInSearch, player);
        this.ids.delete(player.playerId);
        this.allPlayers.delete(id);
    }
    setIdle(id) {
        let player = this.getPlayer(id);
        if (player instanceof Error) {
            return player;
        }
        if (player.state !== PlayerState.Searching) {
            return new Error(ERROR_WRONG_STATE);
        }
        else {
            removeItem(this.playersInSearch, player);
            player.recievedRequests.clear();
            player.state = PlayerState.Idle;
        }
    }
    setSearching(id) {
        let player = this.getPlayer(id);
        if (player instanceof Error) {
            return player;
        }
        if (player.state !== PlayerState.Idle) {
            return new Error(ERROR_WRONG_STATE);
        }
        else {
            this.playersInSearch.push(player);
            player.state = PlayerState.Searching;
        }
    }
    getPlayers() {
        return this.playersInSearch;
    }
    createGame(playerId1, playerId2) {
        let player1 = this.getPlayer(playerId1);
        let player2 = this.getPlayer(playerId2);
        if (player1 instanceof Error || player2 instanceof Error) {
            return new Error(ERROR_UNKNOWN_ID);
        }
        if (player1.state !== PlayerState.Searching || player2.state !== PlayerState.Searching) {
            return new Error(ERROR_WRONG_STATE);
        }
        let game = new Game(playerId1, playerId2);
        player1.state = PlayerState.Playing;
        player1.currentGame = game;
        player1.recievedMessages.splice(0);
        player1.recievedRequests.clear();
        player1.sentRequests.clear();
        player2.state = PlayerState.Playing;
        player2.currentGame = game;
        player2.recievedMessages.splice(0);
        player2.recievedRequests.clear();
        player2.sentRequests.clear();
    }
    /*
    public getRequests(id: PrivateID): Set<PrivateID> | Error {
        let player = this.getPlayer(id);
        if (player instanceof Error) {
            return player;
        }
        if (player.state !== PlayerState.Searching) {
            return new Error(ERROR_WRONG_STATE);
        }

        return player.recievedRequests;
    }*/
    sendRequest(from, to) {
        let player1 = this.getPlayer(from);
        let player2 = this.getPlayer(to);
        if (player1 instanceof Error || player2 instanceof Error) {
            return new Error(ERROR_UNKNOWN_ID);
        }
        if (player1.state !== PlayerState.Searching || player2.state !== PlayerState.Searching) {
            return new Error(ERROR_WRONG_STATE);
        }
        if (player1.recievedRequests.has(to)) {
            this.createGame(from, to);
        }
        else {
            player1.sentRequests.add(to);
            player2.recievedRequests.add(from);
        }
    }
    getOpponent(id) {
        var _a;
        let player = this.getPlayer(id);
        if (player instanceof Error) {
            return player;
        }
        if (player.state !== PlayerState.Playing) {
            return new Error(ERROR_WRONG_STATE);
        }
        let opponentId = (_a = player.currentGame) === null || _a === void 0 ? void 0 : _a.other(id);
        if (opponentId === undefined) {
            throw "This should not have happened";
        }
        let opponent = this.getPlayer(opponentId);
        if (opponent instanceof Error) {
            throw "This should not have happened";
        }
        return opponent;
    }
    getMessages(id) {
        let player = this.getPlayer(id);
        if (player instanceof Error) {
            return player;
        }
        else {
            return player.recievedMessages;
        }
    }
    clearMessages(id) {
        let player = this.getPlayer(id);
        if (player instanceof Error) {
            return player;
        }
        else {
            player.recievedMessages.splice(0);
        }
    }
    sendMessage(from, message) {
        var _a;
        let player1 = this.getPlayer(from);
        if (player1 instanceof Error) {
            return player1;
        }
        if (player1.state !== PlayerState.Playing) {
            return new Error(ERROR_WRONG_STATE);
        }
        let player2Id = (_a = player1.currentGame) === null || _a === void 0 ? void 0 : _a.other(from); // current game is never undefined by now
        if (player2Id === undefined) {
            throw "This should not have happened";
        }
        let player2 = this.getPlayer(player2Id);
        if (player2 instanceof Error || player2.state !== PlayerState.Playing) {
            throw "This should not have happened";
        }
        player2.recievedMessages.push(message);
    }
    endGame(id) {
        let player1 = this.getPlayer(id);
        if (player1 instanceof Error) {
            return player1;
        }
        if (player1.state !== PlayerState.Playing) {
            return new Error(ERROR_WRONG_STATE);
        }
        let game = player1.currentGame;
        if (game === undefined) {
            throw "This should not have happened";
        }
        let player2 = this.getPlayer(game.other(id));
        player1.state = PlayerState.Idle;
        player1.currentGame = undefined;
        player1.recievedMessages.splice(0);
        player1.recievedRequests.clear();
        player1.sentRequests.clear();
        if (!(player2 instanceof Error) && player2.state === PlayerState.Playing) {
            player2.state = PlayerState.Idle;
            player2.currentGame = undefined;
            player2.recievedMessages.splice(0);
            player2.recievedRequests.clear();
            player2.sentRequests.clear();
        }
    }
}
let logic = new Logic();
const app = (0, express_1.default)();
app.use(express_1.default.raw());
const server = http_1.default.createServer(app);
function playerToString(player) {
    return player.playerId.toString() + ':' + player.nickname;
}
function playersToString(players) {
    let res = new Array();
    players.forEach(player => {
        res.push(playerToString(player));
    });
    return res;
}
function stateToJSON(state) {
    switch (state) {
        case PlayerState.Registration: return { "id": 0, "name": "Registation" };
        case PlayerState.Idle: return { "id": 1, "name": "Idle" };
        case PlayerState.Searching: return { "id": 2, "name": "Searching" };
        case PlayerState.Playing: return { "id": 3, "name": "Playing" };
    }
}
function playerToJSON(player, with_private) {
    if (with_private) {
        return {
            "nickname": player.nickname,
            "id": player.id,
            "player_id": player.playerId,
        };
    }
    else {
        return {
            "nickname": player.nickname,
            "player_id": player.playerId,
        };
    }
}
function getIdFromPath(path) {
    /*
    let start = 1;
    let end = path.indexOf('/', start);
    let id = path.substring(start, end);
    return new PrivateID(parseInt(id));
    */
    return parseInt(path.substring(1, path.indexOf('/', 1)));
}
function createErrorResponce(error) {
    let err;
    if (error instanceof Error) {
        err = error;
    }
    else {
        err = new Error(error);
    }
    return {
        "error": {
            "id": err.id,
            "description": err.description(),
            "info": err.info === undefined ? "" : err.info,
        }
    };
}
function createSuccessResponce(res) {
    return {
        "success": res
    };
}
function createResponce(res) {
    if (res instanceof Error || res instanceof Number) {
        return createErrorResponce(res);
    }
    else {
        return createSuccessResponce(res);
    }
}
app.post('/test', (req, res) => {
    res.send(createSuccessResponce({}));
});
app.get("/error_description", (req, res) => {
    let { id } = req.query;
    if (id === undefined) {
        res.send(createErrorResponce(ERROR_WRONG_QUERY));
    }
    else {
        let error = new Error(parseInt(id.toString()));
        res.send(createSuccessResponce({ "description": error.description() }));
    }
});
app.get("/players", (req, res) => {
    let players = logic.getPlayers();
    if (players instanceof Error) {
        res.send(createErrorResponce(players));
    }
    else {
        res.send(createSuccessResponce({ "players": playersToString(players) }));
    }
});
app.get("/*/ping", (req, res) => {
    res.send(createErrorResponce(ERROR_IN_DEVELOPMENT));
});
app.get("/*/state", (req, res) => {
    let id = getIdFromPath(req.url);
    let state = logic.getState(id);
    if (state instanceof Error) {
        res.send(createErrorResponce(state));
    }
    else {
        res.send(createSuccessResponce({ "state": stateToJSON(state) }));
    }
});
app.post("/register", (req, res) => {
    let { nickname } = req.query;
    if (nickname === undefined) {
        res.send(createErrorResponce(ERROR_WRONG_QUERY));
    }
    else {
        let player = logic.register(nickname.toString());
        if (player instanceof Error) {
            res.send(createErrorResponce(player));
        }
        else {
            res.send(createSuccessResponce(playerToJSON(player, true)));
        }
    }
});
app.post("/*/search", (req, res) => {
    let id = getIdFromPath(req.url);
    let r = logic.setSearching(id);
    if (r instanceof Error) {
        res.send(createErrorResponce(r));
    }
    else {
        res.send(createSuccessResponce({}));
    }
});
app.post("/*/idle", (req, res) => {
    let id = getIdFromPath(req.url);
    let r = logic.setIdle(id);
    if (r instanceof Error) {
        res.send(createErrorResponce(r));
    }
    else {
        res.send(createSuccessResponce({}));
    }
});
app.post("/*/requests", (req, res) => {
    let id = getIdFromPath(req.url);
    let { send_to } = req.query;
    if (send_to === undefined) {
        res.send(createErrorResponce(ERROR_WRONG_QUERY));
    }
    else {
        let to = parseInt(send_to.toString());
        let r = logic.sendRequest(id, to);
        if (r instanceof Error) {
            res.send(createErrorResponce(r));
        }
        else {
            res.send(createSuccessResponce({}));
        }
    }
});
app.get("/*/requests", (req, res) => {
    res.send(createErrorResponce(ERROR_IN_DEVELOPMENT));
});
app.get("/*/opponent", (req, res) => {
    let id = getIdFromPath(req.url);
    let opponent = logic.getOpponent(id);
    if (opponent instanceof Error) {
        res.send(createErrorResponce(opponent));
    }
    else {
        res.send(createSuccessResponce(playerToJSON(opponent, false)));
    }
});
app.post("/*/messages", (req, res) => {
    let id = getIdFromPath(req.url);
    let message = req.body.toString();
    let r = logic.sendMessage(id, message);
    if (r instanceof Error) {
        res.send(createErrorResponce(r));
    }
    else {
        res.send(createSuccessResponce({}));
    }
});
app.get("/*/messages", (req, res) => {
    let id = getIdFromPath(req.url);
    let messages = logic.getMessages(id);
    if (messages instanceof Error) {
        res.send(createErrorResponce(messages));
    }
    else {
        res.send(createSuccessResponce({ "messages": messages }));
    }
});
app.post("/*/end_game", (req, res) => {
    let id = getIdFromPath(req.url);
    let r = logic.endGame(id);
    if (r instanceof Error) {
        res.send(createErrorResponce(r));
    }
    else {
        res.send(createSuccessResponce({}));
    }
});
const localPort = "1337";
const port = process.env.PORT || localPort;
server.listen(port);
if (port == localPort) {
    console.log("Server running at http://localhost:" + port);
}
