const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const axios = require("axios")
const querystring = require("querystring");
const SocketProxyServer = require("./SocketProxyServer");
app.set("env", "production");
app.use(express.json());
app.use(express.urlencoded());
app.use(cookieParser());

let startPort = 2080;
let proxyServerList = [];

async function main() {
    app.post('/api/signup_or_login', (req, res) => {
        let cookie = "";
        for (let key in req.cookies) {
            cookie += key + "=" + req.cookies[key] + "; "
        }
        axios.post("https://adventure.land/api/signup_or_login", querystring.stringify(req.body), {
            headers: {
                'Content-type': 'application/x-www-form-urlencoded',
                Cookie: cookie
            }
        }).then(function (response) {
            if (Array.isArray(response.headers["set-cookie"]))
                for (let cookie of response.headers["set-cookie"]) {
                    let key = cookie.split(";")[0].split("=")[0];
                    let value = cookie.split(";")[0].split("=")[1];
                    res.cookie(key, value);
                }
            else
                console.log(response.data)
            res.status(200).send(response.data)
        });
    });

    app.post('/api/servers_and_characters', (req, res) => {
        let cookie = "";
        for (let key in req.cookies) {
            cookie += key + "=" + req.cookies[key] + "; "
        }
        axios.post("https://adventure.land/api/signup_or_login", querystring.stringify(req.body), {
            headers: {
                'Content-type': 'application/x-www-form-urlencoded',
                Cookie: cookie
            }
        }).then(function (response) {
            res.status(200).send(response.data)
        });
    });

    app.use(bodyParser.text());

    app.use(async function (req, res) {
        let data;
        let cookie = "";
        for (let key in req.cookies) {
            cookie += key + "=" + req.cookies[key] + "; "
        }

        try {
            data = await axios.get("https://adventure.land" + req.url, {
                responseType: 'arraybuffer',
                headers: {Cookie: cookie}
            })
        } catch (e) {
            res.status(e.response.status).send(e.data)
            return;
        }

        if (data.headers['content-type'].startsWith("text/html")) {
            let text = data.data.toString();
            {
                let needle = /var server_addr="(.*?)",server_port="(.*?)";/.exec(text)
                if (needle) {
                    let targetHost = needle[1];
                    let targetPort = needle[2];
                    let port = startPort++;
                    let socketProxy = new SocketProxyServer(port, targetHost, targetPort)
                    socketProxy.listen();
                    proxyServerList.push(socketProxy)
                    text = text.replace(needle[0], `var server_addr="localhost",server_port="${port}";`)
                    data.data = Buffer.from(text, 'utf8');
                }
            }
            {
                let needle = /var url_ip='(.*?)',url_port='(.*?)'/.exec(text)
                if (needle) {
                    let targetHost = needle[1];
                    let targetPort = needle[2];
                    let port = startPort++;
                    let socketProxy = new SocketProxyServer(port, targetHost, targetPort)
                    socketProxy.listen();
                    proxyServerList.push(socketProxy)
                    text = text.replace(needle[0], `var url_ip='localhost',url_port='${port}'`)
                    data.data = Buffer.from(text, 'utf8');
                }
            }
        }

        if (data.headers['content-type']) {
            res.removeHeader("content-type")
            res.setHeader("Content-Type", data.headers['content-type'])
        }
        res.status(data.status).send(data.data);
    });
    app.listen(8080, function () {
        console.log('WebServer listening on port ' + 8080 + '.');
    });
}

main();