const WebSocket = require('ws');
const SocketProxy = require("./SocketProxy");

class SocketProxyServer {
    constructor(port, targetHost, targetPort) {
        this.port = port;
        this.targetHost = targetHost;
        this.targetPort = targetPort;
        this.server = null;
        this.sockets = []
    }

    listen() {
        this.server = new WebSocket.Server({
            port: this.port
        });
        this.server.on('connection', (source) => {
            let target = new WebSocket(`wss://${this.targetHost}:${this.targetPort}/socket.io/?EIO=4&transport=websocket`);
            let proxy = new SocketProxy(source, target)
            proxy.start();
        });
    }

}

module.exports = SocketProxyServer;