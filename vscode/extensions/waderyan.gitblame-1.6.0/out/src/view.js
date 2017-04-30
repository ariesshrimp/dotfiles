"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class StatusBarView {
    constructor(statusBarItem) {
        this._statusBarItem = statusBarItem;
        this._statusBarItem.command = "extension.blame";
    }
    refresh(text) {
        this._statusBarItem.text = '$(git-commit) ' + text;
        this._statusBarItem.tooltip = 'git blame';
        this._statusBarItem.show();
    }
}
exports.StatusBarView = StatusBarView;
//# sourceMappingURL=view.js.map