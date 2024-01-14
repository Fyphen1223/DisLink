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
    }
    add = function(server) {
        this.emit('add', server);
        const lavalink = new DisLinkNode(`${server.url}:${server.port}`, {
            headers:{
                "User-Id": server.id,
                "Authorization": server.password,
                "Client-Name": server.clientName || `DisLink/v0.0.1`
            }
        }, server.name, this.discord);
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
class DisLinkNode extends EventEmitter {
    url = null;
    port = null;
    password = null;
    clientName = null;
    ws = null;
    sessionId = null;
    status = null;
    headers = null;
    stats = null;
    guildId = null;
    constructor(url, headers, name, client) {
        super();
        this.url = url;
        this.headers = headers;
        this.name = name;
        this.password = headers.headers.Authorization;
        this.id = headers.headers.id;
        this.client = client;
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
                this.emit('events', data);
            }
        });
    }
    getPlayers = async() =>{
        if(!this.sessionId) throw new Error('The node is waiting for connecting');
        const res = await axios.get(`${this.url}/v4/sessions/${this.sessionId}/players`);
        return res.data;
    }
    join = async(options) => {
        const channel = this.client.channels.cache.get(options.channelId);
        joinVoiceChannel({
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
                voiceChannelId: channel.id
            }
        }
        this.joinQueue = {...this.joinQueue, ...dataForQueue};
        this.client.on('raw', async (data) => {
            if(data.d.guild_id !== channel.guild.id) return;
            if(data.t == "VOICE_STATE_UPDATE" || data.t == "VOICE_SERVER_UPDATE") {
                if(data.t === "VOICE_STATE_UPDATE") {
                    this.joinQueue[data.d.guild_id].sessionId = data.d.session_id;
                } else {
                    this.joinQueue[data.d.guild_id].token = data.d.token;
                    this.joinQueue[data.d.guild_id].endpoint = data.d.endpoint;
                }
            }
        });

        while(this.joinQueue[channel.guild.id].token) {
        }
        const player = new DisLinkPlayer({
            DisLinkNode: this,
            guildId: channel.guild.id,
            voiceChannelId: options.channelId,
            sessionId: this.joinQueue[channel.guild.id].sessionId,
            endpoint: this.joinQueue[channel.guild.id].endpoint
        });
        player.token = this.joinQueue[channel.guild.id].token;
        player.sessionId = this.joinQueue[channel.guild.id].sessionId;
        player.endpoint = this.joinQueue[channel.guild.id].endpoint;
        player.joinVoiceChannel({
            token: player.token,
            sessionId: player.sessionId,
            endpoint: player.endpoint
        });
        await this.emit('voiceConnected', player, channel.guild.id, options.channelId);      
        return player;
    }
    resolve = async(keyword) => {
        const res = await axios.get(`${this.url}/v4/loadtracks?identifier=${keyword}`, {
            headers: {
                "Authorization": this.password
            }
        });
        return res.data;
    }
}
class DisLinkPlayer extends EventEmitter {
    constructor(option) {
        super();
        this.guildId = option.guildId;
        this.voiceChannelId = option.voiceChannelId;
        this.DisLinkNode = option.DisLinkNode;
    }
    joinVoiceChannel = async(options) => {
        const res = await axios.patch(`${this.url}/v4/sessions/${this.sessionId}/players/${options.guildId}?noReplace=false`, {
            voice: {
                token: options.token,
                sessionId: options.sessionId,
                endpoint: options.endpoint
            }
        }, {
            headers: {
                "Authorization": this.password
            }
        });
        console.log(res.data);
        return res;
    }
    play = async function(data) {
        const res = await axios.patch(`${this.DisLinkNode.url}/v4/sessions/${this.DisLinkNode.sessionId}/players/${this.guildId}?noReplace=true`, {
            encodedTrack: data,
        }, {
            headers: {
                "Authorization": this.DisLinkNode.password
            }
        });
        return res.data;
    }
}

module.exports = {DisLinkClient};