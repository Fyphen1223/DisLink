const dislink = require('./index.js');
const lavalinkClient = new dislink.DisLinkClient();

async function main() {
    lavalinkClient.on('ready', function(msg) {
        console.log(`Node ${msg} is ready!`);
    });
    lavalinkClient.add({
        name: "Node 1",
        url: "http://localhost",
        port: 2333,
        password: "youshallnotpass",
        id: "1132870841886060637",
    });
}

main();