"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const gitblame_1 = require("./gitblame");
const view_1 = require("./view");
const controller_1 = require("./controller");
const vscode_1 = require("vscode");
const fs = require("fs");
const path = require("path");
const gitBlameShell = require('git-blame');
function activate(context) {
    // Workspace not using a folder. No access to git repo.
    if (!vscode_1.workspace.rootPath) {
        return;
    }
    const workspaceRoot = vscode_1.workspace.rootPath;
    vscode_1.commands.registerCommand('extension.blame', () => {
        showMessage(context, workspaceRoot);
    });
    // Try to find the repo first in the workspace, then in parent directories
    // because sometimes one opens a subdirectory but still wants information
    // about the full repo.
    lookupRepo(context, workspaceRoot);
}
exports.activate = activate;
function lookupRepo(context, repoDir) {
    const repoPath = path.join(repoDir, '.git');
    fs.access(repoPath, (err) => {
        if (err) {
            // No access to git repo or no repo, try to go up.
            const parentDir = path.dirname(repoDir);
            if (parentDir != repoDir) {
                lookupRepo(context, parentDir);
            }
        }
        else {
            const statusBar = vscode_1.window.createStatusBarItem(vscode_1.StatusBarAlignment.Left);
            const gitBlame = new gitblame_1.GitBlame(repoPath, gitBlameShell);
            const controller = new controller_1.GitBlameController(gitBlame, repoDir, new view_1.StatusBarView(statusBar));
            context.subscriptions.push(controller);
            context.subscriptions.push(gitBlame);
        }
    });
}
function showMessage(context, repoDir) {
    const repoPath = path.join(repoDir, '.git');
    fs.access(repoPath, (err) => {
        if (err) {
            // No access to git repo or no repo, try to go up.
            const parentDir = path.dirname(repoDir);
            if (parentDir != repoDir) {
                showMessage(context, parentDir);
            }
        }
        else {
            const editor = vscode_1.window.activeTextEditor;
            if (!editor)
                return;
            const doc = editor.document;
            if (!doc)
                return;
            if (doc.isUntitled)
                return; // Document hasn't been saved and is not in git.
            const gitBlame = new gitblame_1.GitBlame(repoPath, gitBlameShell);
            const lineNumber = editor.selection.active.line + 1; // line is zero based
            const file = path.relative(repoDir, editor.document.fileName);
            gitBlame.getBlameInfo(file).then((info) => {
                if (lineNumber in info['lines']) {
                    const hash = info['lines'][lineNumber]['hash'];
                    const commitInfo = info['commits'][hash];
                    vscode_1.window.showInformationMessage(hash + ' ' + commitInfo['summary']);
                }
            });
        }
    });
}
//# sourceMappingURL=extension.js.map