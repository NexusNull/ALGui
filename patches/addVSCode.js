const {JSDOM} = require("jsdom")

module.exports = function (meta, data) {
    if (meta.headers['content-type'] && meta.headers['content-type'].startsWith("text/html")) {
        let dom = new JSDOM(data.toString());
        let document = dom.window.document;
        //remove old codeui
        let codeui = document.getElementById("codeui")
        if (!codeui)
            return
        codeui.style.padding = "0";
        codeui.removeChild(codeui.children[0])
        let script = createElement(document, "<script src=\"https://cdn.jsdelivr.net/npm/monaco-editor@0.27.0/min/vs/loader.js\"></script>");
        document.body.appendChild(script);

        let loader = createElement(document, `<script>
            require.config({
                paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.27.0/min/vs" }
                });
            require(["vs/editor/editor.main"], function () {
                var editor = monaco.editor.create(document.getElementById("codeui"), {
                    value: code,
                    language: "javascript",
                    theme: "vs-dark",
                    automaticLayout: true
                });
                editor.onKeyDown(()=>{
                    code_change=true;
                })
                window.monacoEditor = editor; 
                monaco.languages.registerCompletionItemProvider("javascript", {
                    provideCompletionItems: function(model, position, context, token){
                        return new Promise((resolve)=>{
                            resolve({
                                suggestions:[{
                                    kind: monaco.languages.CompletionItemKind.Function,
                                    label: "smart_move",
                                    insertText:"smart_move()"
                                }]
                            });
                        })
                    }
                })
            });</script>`);

        document.body.appendChild(loader);
        return Buffer.from(dom.serialize(), 'utf8');
    }

    //codemirror_render.getValue()
    if (meta.headers['content-type'] && meta.headers['content-type'].startsWith("application/javascript")) {
        let text = data.toString()
        let needle;
        do {
            needle = /codemirror_render.getValue\(\)/.exec(text)
            if (needle) {
                text = text.replace(needle[0], `monacoEditor.getValue()`)
            }
        } while (needle)
        data = Buffer.from(text, 'utf8');
    }

    if (meta.headers['content-type'] && meta.headers['content-type'].startsWith("application/javascript")) {
        let text = data.toString()
        let needle;
        do {
            needle = /codemirror_render.setValue\(info.code\);/.exec(text)
            if (needle) {
                text = text.replace(needle[0], `monacoEditor.executeEdits("la",[{range:new monaco.Range(1,1,2000,2000), text: info.code}])`)
            }
        } while (needle)
        data = Buffer.from(text, 'utf8');
    }

    if (meta.headers['content-type'] && meta.headers['content-type'].startsWith("application/javascript")) {
        let text = data.toString()
        let needle
        do {
            needle = /codemirror_render.refresh\(\);/.exec(text)
            if (needle) {
                text = text.replace(needle[0], ` `)
            }
        } while (needle)
        data = Buffer.from(text, 'utf8');
    }

    return data;
}

function createElement(document, html) {
    let vscode = document.createElement("div");
    vscode.innerHTML = html
    return vscode.children[0];
}