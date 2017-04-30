"use strict";
const mergeConflictParser_1 = require('./mergeConflictParser');
class DocumentMergeConflictTracker {
    constructor() {
        this.cache = new Map();
        this.cacheExperiatinMilliseconds = 250;
    }
    getConflicts(document) {
        // Attempt from cache
        let cacheItem = null;
        let key = this.getCacheKey(document);
        if (key) {
            cacheItem = this.cache.get(key);
        }
        if (cacheItem && (new Date().getTime() - cacheItem.ts.getTime()) < this.cacheExperiatinMilliseconds) {
            return cacheItem.conflicts;
        }
        // Regenerate
        const conflicts = mergeConflictParser_1.MergeConflictParser.containsConflict(document) ? mergeConflictParser_1.MergeConflictParser.scanDocument(document) : [];
        cacheItem = {
            ts: new Date(),
            hasConflicts: conflicts.length > 0,
            conflicts: conflicts
        };
        if (key) {
            this.cache.set(key, cacheItem);
        }
        return cacheItem.conflicts;
    }
    getCacheKey(document) {
        if (document.uri && document.uri.path) {
            return document.uri.path;
        }
        return null;
    }
    dispose() {
        if (this.cache) {
            this.cache.clear();
            this.cache = null;
        }
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DocumentMergeConflictTracker;
//# sourceMappingURL=documentTracker.js.map