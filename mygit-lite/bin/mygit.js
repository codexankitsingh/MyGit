#!/usr/bin/env node

const minimist = require('minimist');
const path = require('path');

const commands = {
    init: require('../commands/init'),
    add: require('../commands/add'),
    commit: require('../commands/commit'),
    status: require('../commands/status'),
    log: require('../commands/log'),
    checkout: require('../commands/checkout'),
    diff: require('../commands/diff'),
    branch: require('../commands/branch')
};

async function main() {
    const argv = minimist(process.argv.slice(2));
    const commandName = argv._[0];

    if (!commandName) {
        console.log('Usage: mygit <command> [args]');
        console.log('Commands: init, add, commit, status, log, checkout, diff, branch');
        process.exit(1);
    }

    const command = commands[commandName];
    if (!command) {
        console.error(`Unknown command: ${commandName}`);
        process.exit(1);
    }

    try {
        await command(argv);
    } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
    }
}

main();
