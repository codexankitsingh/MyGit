const crypto = require('crypto');

/**
 * Computes the SHA-1 hash of a buffer or string.
 * @param {Buffer|string} content 
 * @returns {string} Hex string of the hash
 */
function computeHash(content) {
    const shasum = crypto.createHash('sha1');
    shasum.update(content);
    return shasum.digest('hex');
}

module.exports = { computeHash };
