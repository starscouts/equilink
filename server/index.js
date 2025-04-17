const { WebSocketServer } = require('ws');
const uuid = require('uuid-v4');
const fs = require('fs');
const crypto = require('crypto');

const online = {};
const sockets = {};

let db = require('./data.json');
let lastSaved = fs.readFileSync("./data.json").toString();

setInterval(() => {
    if (JSON.stringify(db) !== lastSaved) {
        fs.writeFileSync("./data.json", JSON.stringify(db));
        lastSaved = JSON.stringify(db);
        console.log("Saved database");
    }
}, 1000);

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', function connection(ws) {
    ws.id = null;
    ws.keepAliveInterval = null;
    ws.lastKeepAlive = null;
    ws.destroyed = false;

    ws.on('error', console.error);

    ws.on('close', () => {
        delete sockets[db[ws.id]['code']][sockets[db[ws.id]['code']].indexOf(ws)];
        clearInterval(ws.keepAliveInterval);

        try {
            if (ws.id && !ws.destroyed) {
                online[db[ws.id]['code']]--;
                if (online[db[ws.id]['code']] < 0) online[db[ws.id]['code']] = 0;
            }
        } catch (e) {
            console.error(e);
        }

        console.log(sockets);
    })

    ws.on('message', (_data) => {
        let data;

        try {
            data = JSON.parse(_data);
            if (data.type !== "refresh" && data.type !== "keepAlive") console.log(data);
        } catch (e) {
            console.log(_data);
        }

        if (!data) return;

        switch (data.type) {
            case "keepAlive":
                ws.lastKeepAlive = new Date().getTime();
                break;

            case "refresh":
                if (ws.id) {
                    let _pre = JSON.parse(JSON.stringify(db[ws.id]));

                    _pre.key = null;
                    _pre.online = [];
                    _pre.displayNames = {};

                    for (let friend of _pre.friends) {
                        _pre.displayNames[friend] = friend;

                        for (let id of Object.keys(db)) {
                            if (db[id].code === friend && db[id].settings.displayName) {
                                _pre.displayNames[friend] = db[id].settings.displayName.trim().replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
                            }
                        }

                        if (online[friend] && online[friend] > 0) {
                            _pre.online.push(friend);
                        }
                    }

                    ws.send(JSON.stringify({
                        type: "refresh",
                        data: _pre
                    }));
                }

                break;

            case "sendRequest":
                if (!ws.id) return;

                for (let id of Object.keys(db)) {
                    if (db[id].code === data.code && !db[id].requests.includes(db[ws.id]["code"])) {
                        db[id].requests.push(db[ws.id]["code"]);
                    }
                }

                break;

            case "settings":
                if (!ws.id) return;

                if (typeof data.settings['displayName'] !== "undefined" && typeof data.settings['displayName'] === "string") {
                    db[ws.id].settings['displayName'] = data.settings['displayName'].trim().substring(0, 50);
                }

                break;

            case "acceptRequest":
                if (!ws.id) return;

                let newList2 = [];

                for (let request of db[ws.id].requests) {
                    if (request !== data.code) {
                        newList2.push(request);
                    } else {
                        for (let id of Object.keys(db)) {
                            if (db[id].code === data.code && !db[id].requests.includes(db[ws.id].code)) {
                                db[id].friends.push(db[ws.id]["code"]);
                                db[ws.id].friends.push(db[id]["code"]);
                            }
                        }
                    }
                }

                db[ws.id].requests = newList2;

                break;

            case "boop":
                if (!ws.id) return;
                let targets = [];

                if (data.target) {
                    for (let friend of db[ws.id].friends) {
                        if (friend === data.target) {
                            targets.push(friend);
                        }
                    }
                }

                if (targets.length === 0) targets = db[ws.id].friends;

                for (let target of targets) {
                    console.log(target, sockets[target] ? true : sockets[target], sockets[target] ? sockets[target].length : null);

                    if (sockets[target] && sockets[target].length > 0) {
                        for (let socket of sockets[target]) { if (socket) {
                            console.log(socket);

                            socket.send(JSON.stringify({
                                type: "boop",
                                source: db[ws.id].code
                            }));
                        }}
                    }
                }

                break;

            case "removeFriend":
                if (!ws.id) return;

                let newList3 = [];

                for (let friend of db[ws.id].friends) {
                    if (friend !== data.code) {
                        newList3.push(friend);
                    } else {
                        for (let id of Object.keys(db)) {
                            if (db[id].code === data.code && db[id].friends.includes(db[ws.id].code)) {
                                let newList4 = [];

                                for (let friend of db[id].friends) {
                                    if (friend !== db[ws.id].code) {
                                        newList4.push(friend);
                                    }
                                }

                                db[id].friends = newList4;
                            }
                        }
                    }
                }

                db[ws.id].friends = newList3;

                break;

            case "rejectRequest":
                if (!ws.id) return;

                let newList = [];

                for (let request of db[ws.id].requests) {
                    if (request !== data.code) {
                        newList.push(request);
                    }
                }

                db[ws.id].requests = newList;

                break;

            case "auth":
                if (data.id && data.key) {
                    if (db[data.id] && db[data.id]["key"] === data.key) {
                        ws.id = data.id;

                        ws.send(JSON.stringify({
                            type: "session",
                            id: db[data.id]["id"],
                            key: db[data.id]["key"],
                            code: db[data.id]["code"]
                        }));
                    } else {
                        ws.send(JSON.stringify({
                            type: "error",
                            error: "INVALID_ID_OR_KEY"
                        }));
                        ws.close();
                        return;
                    }
                } else {
                    let id = uuid();
                    let key = crypto.randomBytes(256).toString("base64");
                    let code = parseInt(crypto.randomBytes(16).toString("hex").substring(0, 12), 16).toString().replace(/^(\d{4})(\d{4})(\d{4})(.*)$/gm, "$1-$2-$3");

                    let entry = {
                        id,
                        key,
                        code,
                        friends: [],
                        requests: [],
                        settings: {}
                    }

                    db[id] = entry;
                    ws.id = id;

                    ws.send(JSON.stringify({
                        type: "session",
                        id,
                        key,
                        code
                    }));
                }

                if (ws.id) {
                    if (online[db[ws.id]['code']]) {
                        online[db[ws.id]['code']]++;
                    } else {
                        online[db[ws.id]['code']] = 1;
                    }

                    if (!sockets[db[ws.id]['code']]) sockets[db[ws.id]['code']] = [];
                    sockets[db[ws.id]['code']].push(ws);
                    console.log(sockets);
                }

                console.log(online);

                ws.keepAliveInterval = setInterval(() => {
                    if (new Date().getTime() - ws.lastKeepAlive > 10000) {
                        ws.destroyed = true;
                        online[db[ws.id]['code']]--;
                        if (online[db[ws.id]['code']] < 0) online[db[ws.id]['code']] = 0;
                        ws.close();
                    }
                }, 10000);

                break;
        }
    });

    ws.send(JSON.stringify({
        type: "init"
    }));
});

console.log("Listening");