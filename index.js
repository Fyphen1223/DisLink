const WebSocket = require('ws');
const { EventEmitter } = require('node:events');
const axios = require('axios');
const { joinVoiceChannel } = require('@discordjs/voice');

class DisLinkClient extends EventEmitter {
    servers = [];
    gateway = null;
    joinQueue = {};
    constructor(client) {
        super();
        this.discord = client.client;
        this.discord.on('raw', async(data) => {
            if(data.t == "VOICE_STATE_UPDATE" || data.t == "VOICE_SERVER_UPDATE") {
                console.log(data);
                if(data.t === "VOICE_STATE_UPDATE") {
                    console.log(data.d.session_id);
                    this.joinQueue[data.d.guild_id].sessionId = data.d.session_id;
                } else {
                    this.joinQueue[data.d.guild_id].token = data.d.token;
                    this.joinQueue[data.d.guild_id].endpoint = data.d.endpoint;
                    const node = this.getIdealNode();
                    node.joinVoiceChannel({
                        token: this.joinQueue[data.d.guild_id].token,
                        sessionId: this.joinQueue[data.d.guild_id].sessionId,
                        token: this.joinQueue[data.d.guild_id].endpoint
                    });
                }
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
    join = async function(options) {
        const channel = this.discord.channels.cache.get(options.channelId);
        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
            selfDeaf: options.selfDeaf || false,
            seldMute: options.seldMute || false,
        });
        const dataForQueue = {
            [channel.guild.id]: {
                token: "",
                sessionId: "",
                endpoint: "",
            }
        }
        this.joinQueue = {...this.joinQueue, ...dataForQueue};
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
    joinVoiceChannel = async function(options) {
        const res = axios.patch(`${this.url}/v4/sessions/${this.sessionId}/players/${this.guildId}?noReplace=false`, {
            voice: {
                token: options.token,
                sessionId: options.sessionId,
                endpoint: options.endpoint
            }
        });
        console.log(res.data);
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