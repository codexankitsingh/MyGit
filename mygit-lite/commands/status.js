const Repo = require('../lib/repo');
const { walk, computeHash } = require('../lib/utils'); // Wait, computeHash is in hasher.js
const { computeHash: hashFunc } = require('../lib/hasher');
const fs = require('fs');
const path = require('path');
const { getCommit } = require('../lib/commit');

module.exports = async function (argv) {
    const repo = new Repo(process.cwd());
    if (!repo.isInitialized()) {
        throw new Error('Not a mygit repository');
    }

    await repo.indexer.load();
    const indexFiles = repo.indexer.getFiles();
    const indexAdded = repo.indexer.data.added; // files added to index since last commit (roughly)

    // To deduce "staged for commit" properly, we should compare Index vs HEAD Tree.
    // To deduce "modified not staged", we compare Working Tree vs Index.
    // To deduce "untracked", we look at Working Tree files not in Index.

    const headId = await repo.getHeadCommitId();
    let headTree = {};
    if (headId) {
        try {
            const headCommit = await getCommit(repo.repoRoot, headId);
            headTree = headCommit.tree;
        } catch (e) {
            // might be corrupted or detached weirdly
        }
    }

    // 1. Staged Changes (Index vs HEAD)
    const staged = [];
    for (const [file, hash] of Object.entries(indexFiles)) {
        if (headTree[file] !== hash) {
            staged.push(`${file} (staged)`);
        }
    }
    // Also check deletions from HEAD not in Index
    for (const file of Object.keys(headTree)) {
        if (!indexFiles[file]) {
            staged.push(`${file} (deleted, staged)`);
        }
    }

    // 2. Modified (Working vs Index) & Untracked
    const modified = [];
    const untracked = [];

    // We need to walk the Working Tree
    const workingFiles = [];
    for await (const absPath of require('../lib/utils').walk(repo.repoRoot)) {
        const relPath = path.relative(repo.repoRoot, absPath);
        workingFiles.push(relPath);

        if (!indexFiles[relPath]) {
            untracked.push(relPath);
        } else {
            // File is tracked. Check if modified.
            // In git, we check stat mtime first, then hash if needed.
            // For MVP, simplistic check: read and hash. (Performance warning!)
            // Optimization: check content only if size/mtime changed?
            // Let's just hash for correctness as per spec "Compare working tree file hashes".
            const content = await fs.promises.readFile(absPath);
            const currentHash = hashFunc(content);
            if (currentHash !== indexFiles[relPath]) {
                modified.push(relPath);
            }
        }
    }

    // Check deleted from working tree but present in index
    const deleted = [];
    for (const file of Object.keys(indexFiles)) {
        const absPath = path.join(repo.repoRoot, file);
        if (!fs.existsSync(absPath)) {
            deleted.push(file);
        }
    }

    console.log(`On branch ${await repo.getCurrentBranchName() || 'detached HEAD'}`);
    console.log('Changes to be committed:');
    staged.forEach(f => console.log(`  ${f}`));
    if (staged.length === 0) console.log('  (none)');

    console.log('\nChanges not staged for commit:');
    modified.forEach(f => console.log(`  modified: ${f}`));
    deleted.forEach(f => console.log(`  deleted: ${f}`));
    if (modified.length === 0 && deleted.length === 0) console.log('  (none)');

    console.log('\nUntracked files:');
    untracked.forEach(f => console.log(`  ${f}`));
    if (untracked.length === 0) console.log('  (none)');
};
