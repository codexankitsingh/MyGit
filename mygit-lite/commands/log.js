const Repo = require('../lib/repo');
const { getCommit } = require('../lib/commit');

module.exports = async function (argv) {
    const repo = new Repo(process.cwd());
    if (!repo.isInitialized()) {
        throw new Error('Not a mygit repository');
    }

    let currentId = await repo.getHeadCommitId();
    if (!currentId) {
        console.log('No commits yet.');
        return;
    }

    const visited = new Set();

    while (currentId) {
        if (visited.has(currentId)) break; // Cycle detection
        visited.add(currentId);

        try {
            const commit = await getCommit(repo.repoRoot, currentId);

            // Output format: short hash oneline if --oneline, else full
            if (argv.oneline) {
                console.log(`${currentId.substring(0, 7)} ${commit.message}`);
            } else {
                console.log(`commit ${currentId}`);
                console.log(`Author: ${commit.author}`);
                console.log(`Date: ${commit.timestamp}`);
                console.log(`\n    ${commit.message}\n`);
            }

            currentId = commit.parent;
        } catch (err) {
            console.error(`Error reading commit ${currentId}: ${err.message}`);
            break;
        }
    }
};
