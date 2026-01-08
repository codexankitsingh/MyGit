# Project Management & Implementation Guide (Antigravity)

## 1. CI Configuration (GitHub Actions)

This workflow lints, runs unit/integration tests, and handles packaging.

### `.github/workflows/ci.yml`

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ master, main ]
    tags: [ 'v*' ]
  pull_request:
    branches: [ master, main ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
    - uses: actions/checkout@v3

    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}

    - name: Install Dependencies
      run: npm ci

    - name: Lint
      run: npm run lint --if-present

    - name: Unit Tests
      run: npm run test:unit

    - name: Integration Tests
      run: npm run test:integration
      env:
        # Run integration tests in a temp directory logic is handled by the test runner script
        CI: true

  package:
    needs: build-and-test
    runs-on: ubuntu-latest
    if: startsWith(github.ref, 'refs/tags/')

    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18.x'
        registry-url: 'https://registry.npmjs.org'
    
    - run: npm ci
    - run: npm publish
      env:
        NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## 2. Release Checklist for Maintainers

1. [ ] **Security Audit**: Run `npm audit` to check for vulnerabilities in dependencies.
2. [ ] **Update CHANGELOG.md**: Document all user-facing changes under the new version header.
3. [ ] **Dump Version**: Run `npm version <major|minor|patch>` to update `package.json` and create a git tag.
4. [ ] **Verify Tests**: Ensure local `npm test` passes completely.
5. [ ] **Push**: `git push --follow-tags` to trigger the CI release pipeline.
6. [ ] **Manual Verification**: Install the new package globally (`npm install -g mygit-lite`) and run `mygit --version`.

## 3. Code Review Checklist

- [ ] **Tests**: specific unit tests added for new logic? Integration test covers the CLI flow?
- [ ] **Path Sanitization**: Are file paths validated to prevent `../` attacks?
- [ ] **Atomic Writes**: Does the code use `write-rename` pattern for critical files?
- [ ] **Performance**: Are we hashing large files efficiently (streams vs buffer)?
- [ ] **Documentation**: JSDoc comments updated? README updated if CLI args changed?

## 4. Security Checklist

- [ ] **Input Sanitization**: All CLI arguments (paths, messages) must be sanitized.
- [ ] **FileSystem Access**: Ensure `mygit` never writes outside the repository root.
- [ ] **Permissions**: `.mygit` directory should be `700` or `755`.
- [ ] **Secrets**: Warn user if they try to commit likely secret files (`.env`, `id_rsa`).

## 5. Integration Test Matrix

| Scenario | Steps | Expected Result |
|qs|---|---|
| Basic Init | `init` | `.mygit` created, config valid |
| Add File | `init` -> `add file.txt` | Blob created, index updated |
| Commit | `add` -> `commit -m "msg"` | Commit object created, HEAD updated |
| Log | `commit` -> `log` | Log shows commit hash and message |
| Checkout | `commit` -> `change file` -> `checkout` | File reverted to commit state |
| Branching | `branch feature` -> `checkout feature` | HEAD points to refs/heads/feature |

## 6. Sprint Roadmap (6 Sprints)

| Sprint | Goals | Deliverables | Acceptance Tests |
|---|---|---|---|
| **1** | Core Repo Structure | `init`, `add` (hashing), `repo` layout | `mygit init && mygit add` creates valid objects |
| **2** | Commits & History | `commit`, `log`, basic `config` | `mygit commit` writes JSON, `mygit log` shows it |
| **3** | Checkout & Head | `checkout <sha>`, `HEAD` management | `mygit checkout` restores files correctly |
| **4** | Index & Status | Refined `index`, `status` command | `mygit status` accurately shows staged/modified |
| **5** | Branches & Diff | `branch`, `diff` (simple) | `mygit branch` works, `diff` shows changes |
| **6** | Polish & Packaging | Error handling, docs, CI setup, npm publish | `npm install` works, invalid inputs handled gracefully |

## How to Evaluate MVP

Run the following script:

```bash
#!/bin/bash
set -e
rm -rf test_repo
mkdir test_repo
cd test_repo
node ../bin/mygit.js init
echo "Hello World" > hello.txt
node ../bin/mygit.js add hello.txt
node ../bin/mygit.js commit -m "First commit"
node ../bin/mygit.js log
# Verify output contains "First commit"
```
