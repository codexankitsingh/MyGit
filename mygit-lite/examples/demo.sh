#!/bin/bash
set -e

# mygit-lite Demo Script

# 1. Setup
echo "--- Setting up demo repo ---"
rm -rf demo_repo
mkdir demo_repo
cd demo_repo

# 2. Init
echo "--- Initializing ---"
mygit init

# 3. Create Content
echo "--- Creating content ---"
echo "# My Project" > README.md
echo "console.log('Hello');" > app.js

# 4. Add
echo "--- Adding files ---"
mygit add README.md app.js
mygit status

# 5. Commit
echo "--- Committing ---"
mygit commit -m "Initial commit"

# 6. Branch & Change
echo "--- Branching to 'feature' ---"
mygit branch feature
mygit checkout feature
echo "// New Feature" >> app.js
mygit add app.js
mygit commit -m "Add feature"

# 7. Log
echo "--- Log ---"
mygit log

echo "--- Demo Complete! ---"
