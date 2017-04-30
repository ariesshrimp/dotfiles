"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
class GitBlame {
    constructor(repoPath, gitBlameProcess) {
        this.repoPath = repoPath;
        this.gitBlameProcess = gitBlameProcess;
        this._blamed = {};
    }
    getBlameInfo(fileName) {
        const self = this;
        return new Promise((resolve, reject) => {
            if (self.needsBlame(fileName)) {
                self.blameFile(self.repoPath, fileName).then((blameInfo) => {
                    self._blamed[fileName] = blameInfo;
                    resolve(self._blamed[fileName]);
                }, reject);
            }
            else {
                resolve(self._blamed[fileName]);
            }
        });
    }
    needsBlame(fileName) {
        return !(fileName in this._blamed);
    }
    fileChanged(fileName) {
        delete this._blamed[fileName];
    }
    blameFile(repo, fileName) {
        const self = this;
        return new Promise((resolve, reject) => {
            const workTree = path.resolve(repo, '..');
            const blameInfo = {
                'lines': {},
                'commits': {}
            };
            self.gitBlameProcess(repo, {
                file: fileName,
                workTree: workTree,
                rev: false
            }).on('data', (type, data) => {
                // outputs in Porcelain format.
                if (type === 'line') {
                    blameInfo['lines'][data.finalLine] = data;
                }
                else if (type === 'commit' && !(data.hash in blameInfo['commits'])) {
                    blameInfo['commits'][data.hash] = data;
                }
            }).on('error', (err) => {
                reject(err);
            }).on('end', () => {
                resolve(blameInfo);
            });
        });
    }
    dispose() {
        // Nothing to release.
    }
}
exports.GitBlame = GitBlame;
//# sourceMappingURL=gitblame.js.map