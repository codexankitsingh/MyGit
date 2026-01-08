const fs = require('fs');
const path = require('path');
const { computeHash } = require('./hasher');
const { atomicWrite } = require('./utils');

class Storage {
    constructor(repoPath) {
        this.repoPath = repoPath;
        this.objectsDir = path.join(repoPath, '.mygit', 'objects');
    }

    /**
     * Initializes the storage directories
     */
    init() {
        if (!fs.existsSync(this.objectsDir)) {
            fs.mkdirSync(this.objectsDir, { recursive: true });
        }
    }

    /**
     * Writes content as a blob to objects storage.
     * @param {Buffer|string} content 
     * @returns {Promise<string>} The hash of the blob
     */
    async writeBlob(content) {
        const hash = computeHash(content);
        // 2-byte prefix sharding is common in git, but spec asked for simple flat objects/<hash>
        // However, keeping flat structure as per spec for simplicity.
        const objectPath = path.join(this.objectsDir, hash);

        if (!fs.existsSync(objectPath)) {
            // Compress? Spec says optional/binary. We'll write raw for MVP simplicity/readability.
            // Deflate could be added here.
            await atomicWrite(objectPath, content);
        }

        return hash;
    }

    /**
     * Reads a blob from storage.
     * @param {string} hash 
     * @returns {Promise<Buffer>}
     */
    async readBlob(hash) {
        const objectPath = path.join(this.objectsDir, hash);
        if (!fs.existsSync(objectPath)) {
            throw new Error(`Object not found: ${hash}`);
        }
        return fs.promises.readFile(objectPath);
    }

    /**
     * Reads a JSON object from storage (commits are also objects in git, but stored separately in spec)
     * Spec says: commits/ <commit-id>.json
     * This class handles Blob (objects/) primarily.
     */
}

module.exports = Storage;
