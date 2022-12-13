const {JSDOM} = require("jsdom")

module.exports = function (meta, data) {
    if (meta.headers['content-type'] && meta.headers['content-type'].startsWith("text/html")) {
        let dom = new JSDOM(data.toString());
        let document = dom.window.document;
        //remove old codeui
        let codeui = document.getElementById("codeui")
        if (!codeui)
            return

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
              window.monacoEditor = editor; 
            });</script>`);

        document.body.appendChild(loader);
        return Buffer.from(dom.serialize(), 'utf8');
    }
    if (meta.headers['content-type'] && meta.headers['content-type'].startsWith("application/javascript")) {
        let text = data.toString()
        let needle = /codemirror_render.setValue\(info.code\);/.exec(text)
        if (needle) {
            text = text.replace(needle[0], `monacoEditor.executeEdits("la",[{range:new monaco.Range(1,1,2000,2000), text: info.code}])`)
        }
        return Buffer.from(text, 'utf8');
    }

}

function createElement(document, html) {
    let vscode = document.createElement("div");
    vscode.innerHTML = html
    return vscode.children[0];
}