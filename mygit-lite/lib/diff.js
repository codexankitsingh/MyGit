const { diffLines } = require('diff');
const fs = require('fs');
const path = require('path');

async function diffFile(repo, filePath, blobHashOld, contentNew) {
    let contentOld = '';
    if (blobHashOld) {
        contentOld = (await repo.storage.readBlob(blobHashOld)).toString('utf-8');
    }

    const diff = diffLines(contentOld, contentNew);
    let output = `Diff for ${filePath}:\n`;

    diff.forEach(part => {
        const color = part.added ? '+' : part.removed ? '-' : ' ';
        if (part.added || part.removed) {
            part.value.split('\n').forEach(line => {
                if (line) output += `${color} ${line}\n`;
            });
        }
    });

    return output;
}

module.exports = { diffFile };
