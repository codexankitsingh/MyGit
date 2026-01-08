const assert = require('assert');
const { computeHash } = require('../../lib/hasher');

describe('Hasher Unit Tests', () => {
    it('should compute consistent SHA-1 hash', () => {
        const input = 'hello';
        const hash1 = computeHash(input);
        const hash2 = computeHash(input);
        assert.strictEqual(hash1, hash2);
        assert.strictEqual(hash1.length, 40);
    });
});
