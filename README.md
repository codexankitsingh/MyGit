# mygit-lite

![Build Status](https://img.shields.io/github/actions/workflow/status/example/mygit-lite/ci.yml?branch=master)
![License](https://img.shields.io/npm/l/mygit-lite)
![Version](https://img.shields.io/npm/v/mygit-lite)

**mygit-lite** — a simplified Git clone written in JavaScript.

This project implements the core internals of Git (blobs, trees, commits, refs) in pure Node.js as an educational tool.

## Features

- **Init**: Create repositories (`.mygit` folder structure)
- **Add**: Hash files (SHA-1) to blob storage
- **Commit**: Create snapshots with author/message
- **Log**: View linear commit history
- **Checkout**: Switch commits/branches (restore working tree)
- **Branch**: Create, list, and delete branches
- **Diff**: View file modifications (index vs working tree)

## Installation

```bash
npm install -g mygit-lite
```

## Quick Start

```bash
# Initialize
mygit init

# Add files
echo "hello" > README.md
mygit add README.md

# Commit
mygit commit -m "Initial commit"

# View History
mygit log
```

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for details on the internal data model.

### Folder Structure

```
mygit-lite/
 ├── bin/          # CLI entry point
 ├── lib/          # Core logic (Repo, Storage, Indexer)
 ├── commands/     # Command implementations
 ├── tests/        # Integration and Unit tests
 └── docs/         # Architecture documentation
```

## Development

**Run tests:**
```bash
npm test
```

**Run local instance:**
```bash
node bin/mygit.js status
```

## Planned Features

- [ ] Merge support
- [ ] Remote remotes (push/pull)
- [ ] Packfiles
- [ ] ".mygitignore" support

## License

MIT
