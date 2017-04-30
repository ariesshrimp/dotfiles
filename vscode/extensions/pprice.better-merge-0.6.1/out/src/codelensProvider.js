"use strict";
const vscode = require('vscode');
class MergeConflictCodeLensProvider {
    constructor(context, tracker) {
        this.context = context;
        this.tracker = tracker;
        this.disposables = [];
    }
    begin() {
        this.disposables.push(vscode.languages.registerCodeLensProvider({ pattern: '**/*' }, this));
    }
    dispose() {
        if (this.disposables) {
            this.disposables.forEach(disposable => disposable.dispose());
            this.disposables = null;
        }
    }
    provideCodeLenses(document, token) {
        let conflicts = this.tracker.getConflicts(document);
        if (!conflicts || conflicts.length === 0) {
            return null;
        }
        let items = [];
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
//# sourceMappingURL=codelensProvider.js.map