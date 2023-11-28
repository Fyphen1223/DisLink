const WebSocket = require('ws');
const url = 'ws://your-server-url.com';
const headers = {
  Authorization: 'Bearer your-token',
  CustomHeader: 'custom-value'
};

class DisLinkClient {
    servers = [];
    constructor(config) {
        this.config = config;
    }
    add = async function(server) {
        const lavalink = new DisLinkServer(`${server.url}:${server.port}/v4/websocket`, {
            headers:{
                "User-Id": server.id,
                "Authorization": server.password,
                "Client-Name": server.clientName || `DisLink/v0.0.1`
            }
        }, server.name);
        this.servers = {...this.server, };
        return;
    }
}

class DisLinkServer {
    password = null;
    clientName = null;
    constructor(url, headers, name) {
        this.name = name;
        this.password = headers.headers.Authorization;
        this.id = headers.headers.id;
        const lavalink = new WebSocket(url, headers);
        this.server = lavalink;
        lavalink.on('open', function() {
            console.log(`Node ${name} is ready.`);
        });
    }
}

module.exports = {DisLinkClient};