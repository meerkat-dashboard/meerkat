#!/bin/bash

REPO_DIR="$1"

# Validate input
if [[ -z "$REPO_DIR" ]]; then
    echo "Usage: $0 /path/to/git/repo"
    exit 1
fi

# Check if directory exists
if [[ ! -d "$REPO_DIR" ]]; then
    echo "Error: Directory does not exist: $REPO_DIR"
    exit 1
fi

cd "$REPO_DIR" || exit 1

# Check if it's a git repository
if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
    echo "Error: Not a Git repository: $REPO_DIR"
    exit 1
fi

# Set Git identity if not globally configured
git config user.name "Auto Commit Bot"
git config user.email "autocommit@meerkat.run"

# Stage all changes
git add -A

# Only commit if there are staged changes
if ! git diff --cached --quiet; then
    git commit -m "Auto commit on $(date '+%Y-%m-%d %H:%M:%S')"
fi
