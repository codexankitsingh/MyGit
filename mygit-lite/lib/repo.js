const fs = require('fs');
const path = require('path');
const Storage = require('./storage');
const Indexer = require('./indexer');
const { atomicWrite } = require('./utils');

class Repo {
    constructor(cwd = process.cwd()) {
        this.repoRoot = this.findRepoRoot(cwd) || cwd; // Default to cwd if not found (for init)
        this.storage = new Storage(this.repoRoot);
        this.indexer = new Indexer(this.repoRoot);
    }

    /**
     * Finds the .mygit root moving upwards
     */
    findRepoRoot(startDir) {
        let current = startDir;
        while (current !== path.parse(current).root) {
            if (fs.existsSync(path.join(current, '.mygit'))) {
                return current;
            }
            current = path.dirname(current);
        }
        if (fs.existsSync(path.join(current, '.mygit'))) return current;
        return null;
    }

    isInitialized() {
        return fs.existsSync(path.join(this.repoRoot, '.mygit'));
    }

    async init() {
        const mygitDir = path.join(this.repoRoot, '.mygit');
        if (fs.existsSync(mygitDir)) {
            throw new Error('Repo already initialized');
        }

        fs.mkdirSync(mygitDir);
        fs.mkdirSync(path.join(mygitDir, 'refs', 'heads'), { recursive: true });
        fs.mkdirSync(path.join(mygitDir, 'commits'));

        // config.json
        const config = { author: "Unknown <unknown@example.com>", hash: "sha1" };
        fs.writeFileSync(path.join(mygitDir, 'config.json'), JSON.stringify(config, null, 2));

        // HEAD
        fs.writeFileSync(path.join(mygitDir, 'HEAD'), 'refs/heads/master');

        // index.json
        await this.indexer.load(); // initializes empty
        await this.indexer.save();

        this.storage.init();
        return true;
    }

    // Helper to read HEAD (returns commit ID or null)
    async getHeadCommitId() {
        const headPath = path.join(this.repoRoot, '.mygit', 'HEAD');
        if (!fs.existsSync(headPath)) return null;

        const headContent = fs.readFileSync(headPath, 'utf-8').trim();
        if (headContent.startsWith('refs/')) {
            const refPath = path.join(this.repoRoot, '.mygit', headContent);
            if (fs.existsSync(refPath)) {
                return fs.readFileSync(refPath, 'utf-8').trim();
            }
            return null; // Branch exists but no commit yet?
        }
        return headContent; // Detached head
    }

    // Update HEAD (or branch it points to)
    async updateHead(commitId) {
        const headPath = path.join(this.repoRoot, '.mygit', 'HEAD');
        const headContent = fs.readFileSync(headPath, 'utf-8').trim();

        if (headContent.startsWith('refs/')) {
            // Update the ref
            const refPath = path.join(this.repoRoot, '.mygit', headContent);
            await atomicWrite(refPath, commitId);
        } else {
            // Detached head, just update HEAD file
            await atomicWrite(headPath, commitId);
        }
    }

    async getCurrentBranchName() {
        const headPath = path.join(this.repoRoot, '.mygit', 'HEAD');
        const headContent = fs.readFileSync(headPath, 'utf-8').trim();
        if (headContent.startsWith('refs/heads/')) {
            return headContent.replace('refs/heads/', '');
        }
        return null;
    }
}

module.exports = Repo;
