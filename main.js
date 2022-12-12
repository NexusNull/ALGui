const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const axios = require("axios")
const querystring = require("querystring");
const fs = require("fs");
const path = require("path");

app.set("env", "production");
app.use(express.json());
app.use(express.urlencoded());
app.use(cookieParser());

let patches = [];
async function readPatches() {
    let patchFiles = fs.readdirSync("./patches");
    for (let patchFile of patchFiles) {
        let patch = require("./" + path.join("./patches/", patchFile))
        patches.push(patch);
    }
}


async function main() {
    await readPatches();
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
        let response = data.data;
        for (let patch of patches) {
            let result = patch({headers: data.headers}, response);
            if (result) {
                response = result;
            }
        }
        if (data.headers['content-type']) {
            res.removeHeader("content-type")
            res.setHeader("Content-Type", data.headers['content-type'])
        }
        res.status(data.status).send(response);
    });
    app.listen(8080, function () {
        console.log('WebServer listening on port ' + 8080 + '.');
    });
}

main();