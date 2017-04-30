"use strict";
const vscode = require('vscode');
const interfaces = require('./interfaces');
class CommandHandler {
    constructor(context, tracker) {
        this.context = context;
        this.tracker = tracker;
        this.disposables = [];
    }
    begin() {
        const textEditorCommand = (name, callback) => {
            this.disposables.push(vscode.commands.registerTextEditorCommand(name, callback, this));
        };
        textEditorCommand('better-merge.accept.ours', this.acceptOurs);
        textEditorCommand('better-merge.accept.theirs', this.acceptTheirs);
        textEditorCommand('better-merge.accept.all.ours', this.acceptAllOurs);
        textEditorCommand('better-merge.accept.all.theirs', this.acceptAllTheirs);
    }
    acceptOurs(editor, edit, ...args) {
        if (!args[0]) {
            return;
        }
        const conflict = args[0];
        conflict.commitEdit(interfaces.CommitType.Ours, editor, edit);
    }
    acceptTheirs(editor, edit, ...args) {
        if (!args[0]) {
            return;
        }
        const conflict = args[0];
        conflict.commitEdit(interfaces.CommitType.Theirs, editor, edit);
    }
    acceptAllOurs(editor, edit, ...args) {
    }
    acceptAllTheirs(editor, edit, ...args) {
    }
    dispose() {
        if (this.disposables) {
            this.disposables.forEach(disposable => disposable.dispose());
            this.disposables = null;
        }
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CommandHandler;
//# sourceMappingURL=commandHandler.js.map