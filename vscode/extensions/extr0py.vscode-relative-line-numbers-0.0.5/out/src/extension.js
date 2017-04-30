'use strict';
var vscode = require('vscode');
var path = require("path");
var MAX_ICONS = 99;
function activate(context) {
    var decorations = createDecorations();
    var isExtensionEnabled = true;
    vscode.commands.registerCommand("extension.relativeLineNumbersEnable", function () {
        isExtensionEnabled = true;
        setRelativeLineDecorations();
    });
    vscode.commands.registerCommand("extension.relativeLineNumbersDisable", function () {
        isExtensionEnabled = false;
        clearRelativeLineDecorations();
    });
    vscode.window.onDidChangeTextEditorSelection(function (e) {
        if (!isExtensionEnabled)
            return;
        setRelativeLineDecorations();
    });
    function setRelativeLineDecorations() {
        var editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        var selection = editor.selection;
        var text = editor.document.getText(selection);
        var line = editor.selection.active.line;
        var totalLines = editor.document.lineCount;
        for (var delta = 1; delta < MAX_ICONS; delta++) {
            var rangesForDecoration = [];
            // Check upwards
            if (line - delta >= 0) {
                rangesForDecoration.push(new vscode.Range(line - delta, 0, line - delta, 0));
            }
            // Check downwards
            if (line + delta < totalLines) {
                rangesForDecoration.push(new vscode.Range(line + delta, 0, line + delta, 0));
            }
            editor.setDecorations(decorations[delta - 1], rangesForDecoration);
        }
    }
    function clearRelativeLineDecorations() {
        var editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        decorations.forEach(function (d) {
            editor.setDecorations(d, []);
        });
    }
}
exports.activate = activate;
function createDecorations() {
    var ret = [];
    for (var i = 1; i < MAX_ICONS; i++) {
        ret.push(vscode.window.createTextEditorDecorationType({
            gutterIconPath: path.join(__dirname, "..", "..", "images", i.toString() + ".png"),
            gutterIconSize: "cover",
        }));
    }
    return ret;
}
// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map