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

const { joinVoiceChannel } = require('@discordjs/voice');

client.on('ready', async () => {
    console.log('Logged in');
    const channel = await client.channels.cache.get('919809544648020012');
    const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
        selfDeaf: false,
        selfMute: false,
    });
});

client.login(config.token);