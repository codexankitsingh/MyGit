const fs = require('fs');
const path = require('path');
const { computeHash } = require('./hasher');
const { atomicWrite } = require('./utils');

class Combmitter {
    // This file seems to be named commit.js in plan, let's export functions or a class.
    // Spec: commit objects stored in .mygit/commits/<id>.json
}

async function createCommit(repoPath, { parentId, tree, author, message, timestamp }) {
    const commitData = {
        id: null, // placeholder, will be filled by hash
        message,
        author,
        timestamp: timestamp || new Date().toISOString(),
        parent: parentId,
        tree
    };

    // Canonical JSON stringify for consistent hashing
    // Sort keys? JSON.stringify order is not guaranteed standardized across engines historically, 
    // but in V8/Node it's insertion order generally. 
    // For stable hashing, we should arguably sort keys.
    // However, let's keep it simple.

    // We explicitly order keys by creating a new object in desired order if needed.
    // The spec example shows id inside the JSON.
    // Usually ID is hash OF the content. Recursive definition? 
    // Git commit objects don't contain their own hash inside the content.
    // Spec says: "Hash commit metadata (canonical JSON) to produce commit ID."
    // AND Spec example shows: "id": "abc..." INSIDE the JSON.
    // This implies we generate other fields, hash that, THEN add ID? Or ID is separate.
    // Let's assume ID is metadata about the file, or included. 
    // Best practice: Hash content WITHOUT id, then store content. 
    // If spec wants ID inside json, we can add it after hashing.

    const contentToHash = JSON.stringify({
        message: commitData.message,
        author: commitData.author,
        timestamp: commitData.timestamp,
        parent: commitData.parent,
        tree: commitData.tree
    });

    const id = computeHash(contentToHash);
    commitData.id = id;

    const commitDir = path.join(repoPath, '.mygit', 'commits');
    if (!fs.existsSync(commitDir)) {
        fs.mkdirSync(commitDir, { recursive: true });
    }

    const commitPath = path.join(commitDir, `${id}.json`);
    await atomicWrite(commitPath, JSON.stringify(commitData, null, 2));

    return id;
}

async function getCommit(repoPath, commitId) {
    const commitPath = path.join(repoPath, '.mygit', 'commits', `${commitId}.json`);
    if (!fs.existsSync(commitPath)) {
        throw new Error(`Commit not found: ${commitId}`);
    }
    const content = await fs.promises.readFile(commitPath, 'utf-8');
    return JSON.parse(content);
}

module.exports = { createCommit, getCommit };
