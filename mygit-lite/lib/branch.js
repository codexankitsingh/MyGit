const fs = require('fs');
const path = require('path');
const { atomicWrite } = require('./utils');

async function createBranch(repo, branchName, commitId) {
    const refPath = path.join(repo.repoRoot, '.mygit', 'refs', 'heads', branchName);
    if (fs.existsSync(refPath)) {
        throw new Error(`Branch '${branchName}' already exists.`);
    }
    await atomicWrite(refPath, commitId);
}

async function deleteBranch(repo, branchName) {
    const currentBranch = await repo.getCurrentBranchName();
    if (branchName === currentBranch) {
        throw new Error(`Cannot delete checked out branch '${branchName}'`);
    }

    const refPath = path.join(repo.repoRoot, '.mygit', 'refs', 'heads', branchName);
    if (!fs.existsSync(refPath)) {
        throw new Error(`Branch '${branchName}' not found.`);
    }
    await fs.promises.unlink(refPath);
}

async function listBranches(repo) {
    const headsDir = path.join(repo.repoRoot, '.mygit', 'refs', 'heads');
    if (!fs.existsSync(headsDir)) return [];

    const branches = await fs.promises.readdir(headsDir);
    return branches;
}

async function getBranchCommit(repo, branchName) {
    const refPath = path.join(repo.repoRoot, '.mygit', 'refs', 'heads', branchName);
    if (fs.existsSync(refPath)) {
        return fs.promises.readFile(refPath, 'utf-8');
    }
    return null;
}

module.exports = { createBranch, deleteBranch, listBranches, getBranchCommit };
