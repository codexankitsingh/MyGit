const Repo = require('../lib/repo');
const { listBranches, createBranch, deleteBranch } = require('../lib/branch');

module.exports = async function (argv) {
    const repo = new Repo(process.cwd());
    if (!repo.isInitialized()) throw new Error('Not a mygit repository');

    // Delete?
    if (argv.d) {
        const branchName = argv._[1]; // mygit branch -d <name> OR mygit branch <name> -d
        // minimist puts args in _
        // command is: mygit branch -d name => arg d=true, _=[branch, name] (if branch is comamnd)
        // Actually mygit.js passes argv starting from command args.
        // mygit branch -d master -> argv._ = ['master'] (if -d parsed as bool)
        // or mygit branch master -d

        const target = argv._[1] || argv.d; // if -d <name> passed? minimist might handle differently based on config
        // Let's assume syntax: mygit branch <name> -d or mygit branch -d <name>
        // if -d is boolean, name is in _
        const name = argv._.length > 1 ? argv._[1] : (typeof argv.d === 'string' ? argv.d : null);

        if (!name) throw new Error('Branch name required for deletion');

        await deleteBranch(repo, name);
        console.log(`Deleted branch ${name}`);
        return;
    }

    // List?
    if (argv._.length === 1) {
        const branches = await listBranches(repo);
        const current = await repo.getCurrentBranchName();

        branches.forEach(b => {
            const prefix = (b === current) ? '* ' : '  ';
            console.log(`${prefix}${b}`);
        });
        return;
    }

    // Create?
    const newName = argv._[1];
    if (newName) {
        const headId = await repo.getHeadCommitId();
        if (!headId) throw new Error('Cannot create branch from empty history');

        await createBranch(repo, newName, headId);
        console.log(`Created branch ${newName}`);
    }
};
