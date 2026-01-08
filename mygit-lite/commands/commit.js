const Repo = require('../lib/repo');
const { createCommit } = require('../lib/commit');
const fs = require('fs');
const path = require('path');

module.exports = async function (argv) {
    if (argv.help || !argv.m) {
        console.log('Usage: mygit commit -m "message"');
        process.exit(0);
    }

    const repo = new Repo(process.cwd());
    if (!repo.isInitialized()) {
        throw new Error('Not a mygit repository');
    }

    await repo.indexer.load();
    const tree = repo.indexer.getFiles();
    const fileCount = Object.keys(tree).length;

    // In real git, we shouldn't commit if empty area (index matches HEAD)?
    // But spec says: "create commit JSON with tree from index.json"
    // For MVP, if index is empty but we want to allow empty commits? 
    // Git usually prevents empty commits unless --allow-empty.
    // We'll allow it if index has files.
    // Actually, we need to handle "modifications". 
    // If index matches parent tree exactly, we might want to warn "nothing to commit".
    // Let's implement that check later. For now, trust the index.

    const parentId = await repo.getHeadCommitId();

    // Load config for author
    const configPath = path.join(repo.repoRoot, '.mygit', 'config.json');
    let author = 'Unknown <unknown@example.com>';
    if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        if (config.author) author = config.author;
    }

    const commitId = await createCommit(repo.repoRoot, {
        parentId,
        tree,
        author,
        message: argv.m
    });

    await repo.updateHead(commitId);
    repo.indexer.clearChanges();
    await repo.indexer.save();

    console.log(`[${commitId.substring(0, 7)}] ${argv.m}`);
};
