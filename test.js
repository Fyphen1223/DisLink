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
    console.log('Logged in');
    lavalinkClient.join({
        channelId: '919809544648020012',
        selfMute: false,
        selfDeaf: false,
    });
});

client.login(config.token);