"use strict";
const vscode = require('vscode');
const merge_conflict_parser_1 = require('./merge-conflict-parser');
class MergeConflictCodeLensProvider {
    constructor(context) {
        this.context = context;
        this.disposables = [];
    }
    begin() {
        this.disposables.push(vscode.languages.registerCodeLensProvider({ pattern: '**/*' }, this), vscode.commands.registerTextEditorCommand('better-merge.accept.ours', (editor, edit, ...args) => {
            if (!args[0]) {
                return;
            }
            const conflict = args[0];
            conflict.commitOursEdit(editor, edit);
        }), vscode.commands.registerTextEditorCommand('better-merge.accept.theirs', (editor, edit, ...args) => {
            if (!args[0]) {
                return;
            }
            const conflict = args[0];
            conflict.commitTheirsEdit(editor, edit);
        }));
    }
    dispose() {
        if (this.disposables) {
            this.disposables.forEach(disposable => disposable.dispose());
            this.disposables = null;
        }
    }
    provideCodeLenses(document, token) {
        if (!merge_conflict_parser_1.default.containsConflict(document)) {
            return null;
        }
        let items = [];
        let conflicts = merge_conflict_parser_1.default.scanDocument(document);
        conflicts.forEach(conflict => {
            let acceptOursCommand = {
                command: 'better-merge.accept.ours',
                title: `Accept Our Changes`,
                arguments: [conflict]
            };
            let acceptTheirsCommand = {
                command: 'better-merge.accept.theirs',
                title: `Accept Their Changes`,
                arguments: [conflict]
            };
            items.push(new vscode.CodeLens(conflict.range, acceptOursCommand));
            items.push(new vscode.CodeLens(conflict.range, acceptTheirsCommand));
        });
        return items;
    }
    resolveCodeLens(codeLens, token) {
        return;
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = MergeConflictCodeLensProvider;
//# sourceMappingURL=codelens-provider.js.map