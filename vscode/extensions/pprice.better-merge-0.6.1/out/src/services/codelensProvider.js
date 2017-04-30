"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const vscode = require('vscode');
class MergeConflictCodeLensProvider {
    constructor(context, tracker) {
        this.context = context;
        this.tracker = tracker;
        this.disposables = [];
    }
    begin(config) {
        this.config = config;
        this.disposables.push(vscode.languages.registerCodeLensProvider({ pattern: '**/*' }, this));
    }
    configurationUpdated(config) {
        this.config = config;
    }
    dispose() {
        if (this.disposables) {
            this.disposables.forEach(disposable => disposable.dispose());
            this.disposables = null;
        }
    }
    provideCodeLenses(document, token) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.config || !this.config.enableCodeLens) {
                return null;
            }
            let conflicts = yield this.tracker.getConflicts(document);
            if (!conflicts || conflicts.length === 0) {
                return null;
            }
            let items = [];
            conflicts.forEach(conflict => {
                let acceptCurrentCommand = {
                    command: 'better-merge.accept.current',
                    title: `Accept current change`,
                    arguments: ['known-conflict', conflict]
                };
                let acceptIncomingCommand = {
                    command: 'better-merge.accept.incoming',
                    title: `Accept incoming change`,
                    arguments: ['known-conflict', conflict]
                };
                let acceptBothCommand = {
                    command: 'better-merge.accept.both',
                    title: `Accept both changes`,
                    arguments: ['known-conflict', conflict]
                };
                items.push(new vscode.CodeLens(conflict.range, acceptCurrentCommand), new vscode.CodeLens(conflict.range, acceptIncomingCommand), new vscode.CodeLens(conflict.range, acceptBothCommand));
            });
            return items;
        });
    }
    resolveCodeLens(codeLens, token) {
        return;
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = MergeConflictCodeLensProvider;
//# sourceMappingURL=codelensProvider.js.map