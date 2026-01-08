const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Atomically writes data to a file by writing to a temp file and renaming.
 * @param {string} filePath - Target file path
 * @param {string|Buffer} content - Content to write
 */
async function atomicWrite(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const tempPath = `${filePath}.tmp.${crypto.randomBytes(4).toString('hex')}`;
  try {
    await fs.promises.writeFile(tempPath, content);
    await fs.promises.rename(tempPath, filePath);
  } catch (err) {
    if (fs.existsSync(tempPath)) {
      await fs.promises.unlink(tempPath).catch(() => {});
    }
    throw err;
  }
}

/**
 * Recursively walks a directory and returns all file paths.
 * @param {string} dir - Directory to walk
 * @param {string[]} ignore - List of directory names to ignore (e.g., '.mygit')
 * @returns {AsyncGenerator<string>}
 */
async function* walk(dir, ignore = ['.mygit', 'node_modules', '.git']) {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const res = path.resolve(dir, entry.name);
    if (entry.isDirectory()) {
      if (!ignore.includes(entry.name)) {
        yield* walk(res, ignore);
      }
    } else {
      yield res;
    }
  }
}

/**
 * Sanitizes a path to ensure it is relative and safe (no .. escaping)
 * @param {string} basePath - The repository root
 * @param {string} inputPath - The potentially unsafe path
 * @returns {string} - The relative, safe path
 * @throws {Error} if path attempts to escape root
 */
function sanitizePath(basePath, inputPath) {
  const absBase = path.resolve(basePath);
  const absInput = path.resolve(basePath, inputPath);
  
  if (!absInput.startsWith(absBase)) {
    throw new Error(`Invalid path: ${inputPath} is outside repository root`);
  }
  
  return path.relative(basePath, absInput);
}

module.exports = { atomicWrite, walk, sanitizePath };
