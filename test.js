const dislink = require('./index.js');

const lavalinkClient = new dislink.DisLinkClient();

async function main() {
    lavalinkClient.add({
        name: "Node 1",
        url: "http://localhost",
        port: 2333,
        password: "youshallnotpass",
        id: "1132870841886060637",
    })
}

main();