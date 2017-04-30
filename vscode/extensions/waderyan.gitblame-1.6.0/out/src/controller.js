"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const textdecorator_1 = require("../src/textdecorator");
const path = require("path");
class GitBlameController {
    constructor(gitBlame, gitRoot, view) {
        this.gitBlame = gitBlame;
        this.gitRoot = gitRoot;
        this.view = view;
        const self = this;
        const disposables = [];
        vscode_1.window.onDidChangeActiveTextEditor(self.onTextEditorMove, self, disposables);
        vscode_1.window.onDidChangeTextEditorSelection(self.onTextEditorSelectionChange, self, disposables);
        vscode_1.workspace.onDidSaveTextDocument(self.onTextEditorSave, self, disposables);
        this.onTextEditorMove(vscode_1.window.activeTextEditor);
        this._disposable = vscode_1.Disposable.from(...disposables);
        this._textDecorator = new textdecorator_1.TextDecorator();
    }
    onTextEditorMove(editor) {
        this.clear();
        if (!editor)
            return;
        const doc = editor.document;
        if (!doc)
            return;
        if (doc.isUntitled)
            return; // Document hasn't been saved and is not in git.
        const lineNumber = editor.selection.active.line + 1; // line is zero based
        const file = path.relative(this.gitRoot, editor.document.fileName);
        this.gitBlame.getBlameInfo(file).then((info) => {
            this.show(info, lineNumber);
        }, () => {
            // Do nothing.
        });
    }
    onTextEditorSave(document) {
        const file = path.relative(this.gitRoot, document.fileName);
        this.gitBlame.fileChanged(file);
        if (vscode_1.window.activeTextEditor) {
            this.onTextEditorMove(vscode_1.window.activeTextEditor);
        }
    }
    onTextEditorSelectionChange(textEditorSelectionChangeEvent) {
        this.onTextEditorMove(textEditorSelectionChangeEvent.textEditor);
    }
    clear() {
        this.view.refresh('');
    }
    show(blameInfo, lineNumber) {
        if (lineNumber in blameInfo['lines']) {
            const hash = blameInfo['lines'][lineNumber]['hash'];
            const commitInfo = blameInfo['commits'][hash];
            this.view.refresh(this._textDecorator.toTextView(commitInfo));
        }
        else {
            // No line info.
        }
    }
    dispose() {
        this._disposable.dispose();
    }
}
exports.GitBlameController = GitBlameController;
//# sourceMappingURL=controller.js.map