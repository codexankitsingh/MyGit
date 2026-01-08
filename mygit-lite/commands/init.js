const Repo = require('../lib/repo');
const path = require('path');

module.exports = async function (argv) {
    if (argv.help) {
        console.log('Usage: mygit init');
        console.log('Initialize a new empty repository in the current directory.');
        process.exit(0);
    }

    const repo = new Repo(process.cwd());
    try {
        await repo.init();
        console.log(`Initialized empty mygit repository in ${path.join(repo.repoRoot, '.mygit')}`);
    } catch (err) {
        // If it's the "already initialized" error, just show it
        throw err;
    }
};
