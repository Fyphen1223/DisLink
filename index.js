const WebSocket = require('ws');
const { EventEmitter } = require('node:events');
const axios = require('axios');

class DisLinkClient extends EventEmitter {
    servers = [];
    constructor(config) {
        super();
        this.config = config;
        this.token = config.token;
    }
    init = async function() {
        const data = await axios.get('https://discordapp.com/api/gateway');
        const gateway = new WebSocket(`${data.data.url}?v=10&encoding=json`);
        gateway.on('message', (msg) => {
            const data = JSON.parse(msg.toString());
            console.log(data);
            if(data.op == 10) {
                setInterval(function() {
                    gateway.send(JSON.stringify({ "op": 1, "d": null }));
                }, data.d.heartbeat_interval);
                gateway.send(JSON.stringify({
                    "op": 2,
                    "d": {
                      "token": this.token,
                      "intents": 128,
                      "properties": {
                      }
                    }
                }));
            }
            if(data.t === 'READY') {
                this.emit('discordReady');
            }
        });
    }
    add = function(server) {
        this.emit('add', server);
        const lavalink = new DisLinkNode(`${server.url}:${server.port}`, {
            headers:{
                "User-Id": server.id,
                "Authorization": server.password,
                "Client-Name": server.clientName || `DisLink/v0.0.1`
            }
        }, server.name, this.token);
        this.servers.push(lavalink);
        lavalink.on('ready', (msg) => {
            this.emit('ready', msg);
        });
        return this;
    }
    getIdealNode = function() {
        return this.servers[0];
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
    stats = null;
    token = null;
    constructor(url, headers, name, token) {
        super();
        this.token = token;
        this.url = url;
        this.headers = headers;
        this.name = name;
        this.password = headers.headers.Authorization;
        this.id = headers.headers.id;
        const lavalink = new WebSocket(`${url}/v4/websocket`, headers);
        this.ws = lavalink;
        lavalink.on('open', () => {
            this.emit('open', name);
        })
        lavalink.on('error', (err) => {
            this.emit('error', err);
        })
        lavalink.on('message', (msg) => {
            const data = JSON.parse(msg.toString());
            if(data.op === 'ready') {
                this.status = 'ready';
                this.sessionId = data.sessionId;
                this.emit('ready', name);
            }
            if(data.op === 'stats') {
                this.stats = data;
                this.emit('stats', data);
            }
            if(data.op === 'event') {

            }
        });
    }
    getPlayers = async function () {
        if(!this.sessionId) throw new Error('The node is waiting for connecting');
        const res = await axios.get(`${this.url}/v4/sessions/${this.sessionId}/players`);
        return res.data;
    }
    join = async function(guildId, channelId) {
    }
}

class DisLinkPlayer extends EventEmitter {
    constructor(option) {
        this.guildId = option.guildId;
        this.voiceChannelId = option.voiceChannelId;
        this.DisLinkNode = option.DisLinkNode;
        this.DisLinkClient = option.DisLinkClient;
        this.token = option.token;
    }

}

module.exports = {DisLinkClient};