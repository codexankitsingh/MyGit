const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TEST_DIR = path.join(__dirname, 'test_run_' + Date.now());
const BIN = path.resolve(__dirname, '../../bin/mygit.js');

describe('Integration Tests', function () {
    this.timeout(10000);

    beforeEach(() => {
        fs.mkdirSync(TEST_DIR);
    });

    afterEach(() => {
        fs.rmSync(TEST_DIR, { recursive: true, force: true });
    });

    it('should run the full lifecycle: init, add, commit, log, checkout', () => {
        const run = (cmd) => execSync(`node ${BIN} ${cmd}`, { cwd: TEST_DIR, encoding: 'utf-8' });

        // Init
        run('init');
        assert.ok(fs.existsSync(path.join(TEST_DIR, '.mygit')));

        // Create file
        fs.writeFileSync(path.join(TEST_DIR, 'hello.txt'), 'Hello World');

        // Add
        run('add hello.txt');
        const status1 = run('status');
        assert.ok(status1.includes('hello.txt'));

        // Commit
        const commitOut = run('commit -m "First commit"');
        assert.ok(commitOut.includes('First commit'));

        // Log
        const logOut = run('log');
        assert.ok(logOut.includes('First commit'));
        assert.ok(logOut.includes('Author:'));

        // Modify file
        fs.writeFileSync(path.join(TEST_DIR, 'hello.txt'), 'Hello Modified');
        const status2 = run('status');
        assert.ok(status2.includes('modified: hello.txt'));

        // Checkout (revert)
        // Need commit ID. Log output likely has it.
        // But HEAD should point to it.
        // run checkout HEAD (this should revert the working tree to HEAD, wiping modification)
        // Wait, default checkout expects args. 
        // mygit checkout <commit>
        // Use forced checkout to wipe changes
        run('checkout HEAD --force');

        const content = fs.readFileSync(path.join(TEST_DIR, 'hello.txt'), 'utf-8');
        assert.strictEqual(content, 'Hello World'); // Should be reverted
    });
});
