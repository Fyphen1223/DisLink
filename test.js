const dislink = require('./index.js');
const config = require('./config.json');
const lavalinkClient = new dislink.DisLinkClient({
    "token": config.token
});

async function main() {
    lavalinkClient.on('ready', async function(msg) {
        console.log(`Node ${msg} is ready!`);
        lavalinkClient.init();
    });
    lavalinkClient.add({
        name: "Node 2",
        url: "http://localhost",
        port: 2333,
        password: "youshallnotpass",
        id: "1132870841886060637",
    });
    const node = lavalinkClient.getIdealNode();
    await node.join('919809544648020008', '919809544648020012');
}

main();