const WebSocket = require('ws');
const { EventEmitter } = require('node:events');

class DisLinkClient extends EventEmitter {
    servers = [];
    constructor(config) {
        super();
        this.config = config;
    }
    add = function(server) {
        this.emit('add', server);
        const lavalink = new DisLinkNode(`${server.url}:${server.port}/v4/websocket`, {
            headers:{
                "User-Id": server.id,
                "Authorization": server.password,
                "Client-Name": server.clientName || `DisLink/v0.0.1`
            }
        }, server.name);
        this.servers.push(lavalink);
        lavalink.on('ready', (msg) => {
            this.emit('ready', msg);
        });
        return this;
    }
}

class DisLinkNode extends EventEmitter{
    url = null;
    port = null;
    password = null;
    clientName = null;
    ws = null;
    sessionId = null;
    status = null;
    headers = null;
    constructor(url, headers, name) {
        super();
        this.url = url;
        this.headers = headers;
        this.name = name;
        this.password = headers.headers.Authorization;
        this.id = headers.headers.id;
        const lavalink = new WebSocket(url, headers);
        this.ws = lavalink;
        lavalink.on('message', (msg) => {
            const data = JSON.parse(msg.toString());
            if(data.op === 'ready') {
                this.emit('ready', name);
                this.status = 'ready';
                this.sessionId = data.sessionId;
            }
        });
    }
}

module.exports = {DisLinkClient};