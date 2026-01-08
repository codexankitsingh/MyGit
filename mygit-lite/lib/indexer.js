const fs = require('fs');
const path = require('path');
const { atomicWrite } = require('./utils');

class Indexer {
    constructor(repoPath) {
        this.repoPath = repoPath;
        this.indexPath = path.join(repoPath, '.mygit', 'index.json');
        this.data = { files: {}, added: [], modified: [], deleted: [] };
    }

    /**
     * Loads the index from disk.
     */
    async load() {
        if (fs.existsSync(this.indexPath)) {
            try {
                const content = await fs.promises.readFile(this.indexPath, 'utf-8');
                this.data = JSON.parse(content);
            } catch (err) {
                console.error('Warning: Corrupt index.json, resetting.');
                this.data = { files: {}, added: [], modified: [], deleted: [] };
            }
        }
    }

    /**
     * Adds a file entry to the index.
     * @param {string} filePath - Relative path
     * @param {string} hash - Blob hash
     */
    add(filePath, hash) {
        const existingHash = this.data.files[filePath];
        if (existingHash !== hash) {
            this.data.files[filePath] = hash;

            // Track status (simplified for MVP: if added vs modified logic needed later)
            // Spec: { "files": ..., "added": [...], "modified": ... }
            // This is a bit transient; usually 'status' is computed by comparing index vs HEAD.
            // But spec requests index.json to hold these lists. We'll append for now.
            if (!this.data.added.includes(filePath) && !this.data.modified.includes(filePath)) {
                this.data.added.push(filePath);
            }
        }
    }

    /**
     * Saves the index to disk.
     */
    async save() {
        await atomicWrite(this.indexPath, JSON.stringify(this.data, null, 2));
    }

    /**
     * Returns current file map
     */
    getFiles() {
        return this.data.files;
    }

    /**
     * Clears changes lists (called after commit)
     */
    clearChanges() {
        this.data.added = [];
        this.data.modified = [];
        this.data.deleted = [];
        // files map persists
    }
}

module.exports = Indexer;
