"use strict";
const vscode = require('vscode');
class MergeDectorator {
    constructor(context, tracker) {
        this.context = context;
        this.tracker = tracker;
        this.decorations = {};
        this.decorationUsesWholeLine = true; // Useful for debugging, set to false to see exact match ranges
        // TODO: Move to config?
        this.oursColorRgb = `32,200,94`;
        this.theirsColorRgb = `24,134,255`;
        // Create decorators
        this.decorations['ours.content'] = vscode.window.createTextEditorDecorationType({
            backgroundColor: `rgba(${this.oursColorRgb}, 0.2)`,
            isWholeLine: this.decorationUsesWholeLine,
            overviewRulerColor: `rgba(${this.oursColorRgb}, 0.5)`,
            overviewRulerLane: vscode.OverviewRulerLane.Full
        });
        this.decorations['ours.header'] = vscode.window.createTextEditorDecorationType({
            // backgroundColor: 'rgba(255, 0, 0, 0.01)',
            // border: '2px solid red',
            isWholeLine: this.decorationUsesWholeLine,
            backgroundColor: `rgba(${this.oursColorRgb}, 1.0)`,
            color: 'white',
            after: {
                contentText: ' (Our Changes)',
                color: 'rgba(0, 0, 0, 0.7)'
            },
            gutterIconPath: context.asAbsolutePath('./img/merge-white.png'),
            gutterIconSize: '75%'
        });
        this.decorations['splitter'] = vscode.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(0, 0, 0, 0.25)',
            color: 'white',
            isWholeLine: this.decorationUsesWholeLine,
        });
        this.decorations['theirs.content'] = vscode.window.createTextEditorDecorationType({
            backgroundColor: `rgba(${this.theirsColorRgb}, 0.2)`,
            isWholeLine: this.decorationUsesWholeLine,
            overviewRulerColor: `rgba(${this.theirsColorRgb}, 0.5)`,
            overviewRulerLane: vscode.OverviewRulerLane.Full
        });
        this.decorations['theirs.header'] = vscode.window.createTextEditorDecorationType({
            backgroundColor: `rgba(${this.theirsColorRgb}, 1.0)`,
            color: 'white',
            isWholeLine: this.decorationUsesWholeLine,
            after: {
                contentText: ' (Their Changes)',
                color: 'rgba(0, 0, 0, 0.7)'
            }
        });
    }
    begin() {
        // Check if we already have a set of active windows, attempt to track these.
        vscode.window.visibleTextEditors.forEach(e => this.applyDecorations(e));
        vscode.workspace.onDidOpenTextDocument(event => {
            this.applyDecorationsFromEvent(event);
        }, null, this.context.subscriptions);
        vscode.workspace.onDidChangeTextDocument(event => {
            this.applyDecorationsFromEvent(event.document);
        }, null, this.context.subscriptions);
        vscode.window.onDidChangeActiveTextEditor((e) => {
            // New editor attempt to apply
            this.applyDecorations(e);
        }, null, this.context.subscriptions);
    }
    dispose() {
        if (this.decorations) {
            Object.keys(this.decorations).forEach(name => {
                this.decorations[name].dispose();
            });
            this.decorations = null;
        }
    }
    applyDecorationsFromEvent(eventDocument) {
        for (var i = 0; i < vscode.window.visibleTextEditors.length; i++) {
            if (vscode.window.visibleTextEditors[i].document === eventDocument) {
                // Attempt to apply
                this.applyDecorations(vscode.window.visibleTextEditors[i]);
            }
        }
    }
    applyDecorations(editor) {
        if (!editor) {
            return;
        }
        let conflicts = this.tracker.getConflicts(editor.document);
        if (conflicts.length === 0) {
            // TODO: Remove decorations
            this.removeDecorations(editor);
            return;
        }
        // Store decorations keyed by the type of decoration, set decoration wants a "style"
        // to go with it, which will match this key (see constructor);
        let matchDecorations = {};
        let pushDecoration = (key, d) => {
            matchDecorations[key] = matchDecorations[key] || [];
            matchDecorations[key].push(d);
        };
        conflicts.forEach(conflict => {
            // TODO, this could be more effective, just call getMatchPositions once with a map of decoration to position
            pushDecoration('ours.header', { range: conflict.ours.header });
            pushDecoration('ours.content', { range: conflict.ours.content });
            pushDecoration('splitter', { range: conflict.splitter });
            pushDecoration('theirs.content', { range: conflict.theirs.content });
            pushDecoration('theirs.header', { range: conflict.theirs.header });
        });
        // For each match we've generated, apply the generated decoration with the matching decoration type to the
        // editor instance. Keys in both matches and decorations should match.
        Object.keys(matchDecorations).forEach(decorationSetName => {
            editor.setDecorations(this.decorations[decorationSetName], matchDecorations[decorationSetName]);
        });
    }
    removeDecorations(editor) {
        // Remove all decorations, there might be none
        Object.keys(this.decorations).forEach(decorationKey => {
            editor.setDecorations(this.decorations[decorationKey], []);
        });
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = MergeDectorator;
//# sourceMappingURL=mergeDecorator.js.map