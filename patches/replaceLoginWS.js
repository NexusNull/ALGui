const SocketProxyServer = require("../SocketProxyServer");
let startPort = 3080
let proxyServerList = [];

module.exports = function (meta, data) {
    if (meta.headers['content-type'] && meta.headers['content-type'].startsWith("text/html")) {
        let text = data.toString();
        let needle = /var url_ip='(.*?)',url_port='(.*?)'/.exec(text)
        if (needle) {
            let targetHost = needle[1];
            let targetPort = needle[2];
            let port = startPort++;
            let socketProxy = new SocketProxyServer(port, targetHost, targetPort)
            socketProxy.listen();
            proxyServerList.push(socketProxy)
            text = text.replace(needle[0], `var url_ip='localhost',url_port='${port}'`)
        }
        return Buffer.from(text, 'utf8');
    }
}