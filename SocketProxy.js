const WebSocket = require('ws');

class SocketProxy {
    /**
     *
     * @param ins : WebSocket
     * @param out : WebSocket
     */
    constructor(ins, out) {
        this.ins = ins;
        this.out = out;
    }

    start() {
        this.ins.on('message', (msg) => {
            this.out.send(msg.toString());
            //console.log("<-" + msg.toString())
        });

        this.out.on('message', (msg) => {
            this.ins.send(msg.toString())
            //console.log("->" + msg.toString())
        });

        this.out.onerror = console.log;

        this.ins.on('close', () => {
            console.log("Connection close")
            this.out.close();
        });

        this.out.on('close', () => {
            this.ins.close();
        });
    }

}

module.exports = SocketProxy;