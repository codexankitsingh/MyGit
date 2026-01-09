# mygit-lite Architecture

## Overview

`mygit-lite` is a simplified, educational version control system that mimics Git's core internal structure. It uses a file-based object store and a simple JSON metadata format.

## Directory Structure

```text
.mygit/
  config.json          # Configuration (author, etc.)
  HEAD                 # Points to current branch ref or commit ID
  index.json           # Staging area
  refs/
    heads/             # Branch pointers (files containing commit IDs)
  objects/             # Content-addressable storage (blobs)
  commits/             # Commit objects (JSON)
```

## Data Model

### Blobs (`objects/`)

Files are stored as "Blobs". The content of the file is hashed using SHA-1. The file is saved in `.mygit/objects/<hash>` containing the raw content.

### Index (`index.json`)

The "Index" or "Staging Area" tracks files to be included in the next commit.

```json
{
  "files": {
    "src/app.js": "da39a3ee5e6b4b0d3255bfef95601890afd80709",
    "README.md": "..."
  },
  "added": ["src/app.js"],
  "modified": [],
  "deleted": []
}
```

### Commit (`commits/`)

A commit is a snapshot of the project state at a point in time. It is stored as a JSON file named by its hash.

```json
{
  "id": "abc1234...",
  "message": "Start project",
  "author": "User <user@example.com>",
  "timestamp": "2023-01-01T12:00:00.000Z",
  "parent": null, 
  "tree": {
    "src/app.js": "da39a3ee5e6b4b0d3255bfef95601890afd80709"
  }
}
```

## Algorithms

### Hashing
We use **SHA-1** to generate unique identifiers for content.
`Hash(Content) -> 40-char Hex String`

### Atomic Writes
All modifications to critical files (`index.json`, `refs`, objects) use a "write-to-temp-then-rename" strategy to ensure data integrity during crashes.

### Branching
A branch is simply a file in `refs/heads/<name>` that contains the 40-character commit ID of the latest commit on that branch. `HEAD` points to one of these files (e.g., `refs/heads/master`).

## Code Structure

- **`bin/mygit.js`**: CLI entry point. Parses args and dispatches to commands.
- **`lib/repo.js`**: Central repository class. Handles init and HEAD.
- **`lib/storage.js`**: Manages `objects/` directory.
- **`lib/indexer.js`**: Manages `index.json`.
- **`lib/commit.js`**: Creates and reads commit objects.
