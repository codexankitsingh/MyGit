const Repo = require('../lib/repo');
const { diffFile } = require('../lib/diff');
const fs = require('fs');
const path = require('path');

module.exports = async function (argv) {
    const repo = new Repo(process.cwd());
    if (!repo.isInitialized()) throw new Error('Not a mygit repository');

    // MVP: Diff working tree vs Index
    await repo.indexer.load();
    const indexFiles = repo.indexer.getFiles();

    // Iterate all files in index (tracked files)
    // Compare content in Working Tree vs Blob in Index

    for (const [file, hash] of Object.entries(indexFiles)) {
        const absPath = path.join(repo.repoRoot, file);
        if (fs.existsSync(absPath)) {
            const content = await fs.promises.readFile(absPath, 'utf-8');
            // We compute hash to see IF modified, or just run diff (expensive but correct)
            const diffOutput = await diffFile(repo, file, hash, content);
            // Only print if diff exists
            // npm diff lines output usually is empty logic-wise if matches?
            // Our diffFile wrapper always returns "Diff for X", we should check if meaningful.
            if (diffOutput.includes('\n')) { // Has lines
                process.stdout.write(diffOutput);
            }
        } else {
            console.log(`Diff for ${file}: file deleted in working tree`);
        }
    }

    // Todo: support commit refs args
};
