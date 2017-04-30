"use strict";
const vscode = require('vscode');
class DocumentMergeConflict {
    constructor(document, match, offsets) {
        this.ours = {
            name: match[2],
            header: this.getMatchPositions(document, match, 1, offsets),
            content: this.getMatchPositions(document, match, 3, offsets),
        };
        this.splitter = this.getMatchPositions(document, match, 5, offsets);
        this.theirs = {
            name: match[9],
            header: this.getMatchPositions(document, match, 8, offsets),
            content: this.getMatchPositions(document, match, 6, offsets),
        };
        this.range = this.getMatchPositions(document, match, 0, offsets);
    }
    commitOursEdit(editor, edit) {
        edit.replace(this.range, editor.document.getText(this.ours.content));
    }
    commitTheirsEdit(editor, edit) {
        edit.replace(this.range, editor.document.getText(this.theirs.content));
    }
    getMatchPositions(document, match, groupIndex, offsetGroups) {
        // Javascript doesnt give of offsets within the match, we need to calculate these
        // based of the prior groups, skipping nested matches (yuck).
        if (!offsetGroups) {
            offsetGroups = match.map((i, idx) => idx);
        }
        let start = match.index;
        for (var i = 0; i < offsetGroups.length; i++) {
            let value = offsetGroups[i];
            if (value >= groupIndex) {
                break;
            }
            start += match[value].length;
        }
        let targetMatchLength = match[groupIndex].length;
        let end = (start + targetMatchLength);
        // Move the end up if it's capped by a trailing \r\n, this is so regions don't expand into
        // the line below, and can be "pulled down" by editing the line below
        if (match[groupIndex].lastIndexOf('\n') === targetMatchLength - 1) {
            end--;
            // .. for windows encodings of new lines
            if (match[groupIndex].lastIndexOf('\r') === targetMatchLength - 2) {
                end--;
            }
        }
        return new vscode.Range(document.positionAt(start), document.positionAt(end));
    }
}
exports.DocumentMergeConflict = DocumentMergeConflict;
class MergeConflictParser {
    scanDocument(document) {
        // Match groups
        // 1: "our" header
        // 2: "our" name
        // 3: "our" content
        // 4: Garbage (rouge \n)
        // 5: Splitter
        // 6: "their" content
        // 7: Garbage  (rouge \n)
        // 8: "their" header
        // 9: "their" name
        const conflictMatcher = /(<<<<<<< (.+)\r?\n)^((.*\s)+?)(^=======\r?\n)^((.*\s)+?)(^>>>>>>> (.+)$)/mg;
        const offsetGroups = [1, 3, 5, 6, 8]; // Skip inner matches when calculating length
        let result = [];
        let text = document.getText();
        let match;
        while (match = conflictMatcher.exec(text)) {
            // Esnure we don't get stuck in an infinite loop
            if (match.index === conflictMatcher.lastIndex) {
                conflictMatcher.lastIndex++;
            }
            result.push(new DocumentMergeConflict(document, match, offsetGroups));
        }
        return result;
    }
    containsConflict(document) {
        if (!document) {
            return false;
        }
        // TODO: Ask source control if the file contains a conflict
        let text = document.getText();
        return text.includes('<<<<<<<') && text.includes('>>>>>>>');
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = new MergeConflictParser();
//# sourceMappingURL=merge-conflict-parser.js.map