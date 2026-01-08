const Repo = require('../lib/repo');
const { walk, sanitizePath } = require('../lib/utils');
const fs = require('fs');
const path = require('path');

module.exports = async function (argv) {
    if (argv.help || argv._.length < 2) {
        console.log('Usage: mygit add <file>...');
        process.exit(0);
    }

    const repo = new Repo(process.cwd());
    if (!repo.isInitialized()) {
        throw new Error('Not a mygit repository');
    }

    await repo.storage.init(); // Ensure objects dir exists
    await repo.indexer.load();

    const targets = argv._.slice(1);

    for (const target of targets) {
        // Handle globs or directories if we had a globber, but for now simple recursion or file
        // MVP: recursive add if directory
        const absTarget = path.resolve(process.cwd(), target);

        // Ensure target is inside repo
        sanitizePath(repo.repoRoot, target);

        let filesToAdd = [];
        if (fs.statSync(absTarget).isDirectory()) {
            for await (const p of walk(absTarget)) {
                filesToAdd.push(p);
            }
        } else {
            filesToAdd.push(absTarget);
        }

        for (const file of filesToAdd) {
            const relPath = path.relative(repo.repoRoot, file);
            const content = await fs.promises.readFile(file);
            const hash = await repo.storage.writeBlob(content);
            repo.indexer.add(relPath, hash);
            console.log(`Added ${relPath}`);
        }
    }

    await repo.indexer.save();
};
