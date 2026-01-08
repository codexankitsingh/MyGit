const fs = require('fs');
const path = require('path');
const { getCommit } = require('./commit');
const { atomicWrite, walk } = require('./utils');

/**
 * Updates the working tree to match the target tree.
 * Warning: Destructive! Assumes safety checks passed.
 */
async function checkoutTree(repo, targetTree) {
    // 1. Identify what to remove (files in working tree not in target)
    // For simplicity/safety, we only remove tracked files that are missing in target.
    // Untracked files are left alone (git behavior).

    await repo.indexer.load();
    const indexFiles = repo.indexer.getFiles();

    // We iterate current index to see what we are tracking.
    // If it's in index but not in targetTree, delete it.
    // Wait, if we are switching from Commit A to Commit B.
    // We should look at Index (which reflects Commit A roughly).
    // Correct approach:
    //  - Iterate targetTree: write/overwrite all files with blob content.
    //  - Iterate Index/CurrentTree: identify files NOT in targetTree, delete them.

    const filesToDelete = Object.keys(indexFiles).filter(f => !targetTree[f]);

    for (const file of filesToDelete) {
        const absPath = path.join(repo.repoRoot, file);
        if (fs.existsSync(absPath)) {
            await fs.promises.unlink(absPath);
        }
    }

    // 2. Write/Update files from targetTree
    // Optimization: only write if hash differs? 
    // Yes, for speed and preserving mtime if unchanged.

    for (const [file, blobHash] of Object.entries(targetTree)) {
        const absPath = path.join(repo.repoRoot, file);
        const currentHash = indexFiles[file];

        // Write content
        // Optimization: In a real VCS we'd check mtime/size or hash the working file.
        // For MVP correctness (ensuring we revert dirty files), we simply overwrite.
        const content = await repo.storage.readBlob(blobHash);
        await atomicWrite(absPath, content);
    }

    // 3. Update Index to match targetTree
    // We reset index completely to the target tree
    repo.indexer.data.files = { ...targetTree };
    repo.indexer.data.added = [];
    repo.indexer.data.modified = [];
    repo.indexer.data.deleted = [];
    await repo.indexer.save();
}

module.exports = { checkoutTree };
