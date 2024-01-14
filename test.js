const dislink = require('./index.js');
const config = require('./config.json');
const discord = require('discord.js');
const client = new discord.Client({
    intents: [
        discord.GatewayIntentBits.GuildVoiceStates,
        discord.GatewayIntentBits.Guilds,
    ],
    partials: [
        discord.Partials.Channel,
    ],
});
const lavalinkClient = new dislink.DisLinkClient({
    client: client,
});

client.on('ready', async () => {
    lavalinkClient.add({
        url: "http://localhost",
        port: 2333,
        id: "1132870841886060637",
        password: "youshallnotpass",
        name: "DisLink Node 1"
    });
    console.log('Logged in');
    const node = lavalinkClient.getIdealNode();
    const player = await node.join({
        channelId: '919809544648020012',
        guildId: '919809544648020008',
        selfMute: false,
        selfDeaf: false,
    });
    const res = await node.resolve("ytsearch:Alan Walker");
    player.play(res.data[0].encoded);
});

client.login(config.token);