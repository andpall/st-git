#!/usr/bin/env bash
set -e
DIR="$(cd "$(dirname "$0")/.." && pwd)/.playground"
[ "$1" = "--reset" ] && rm -rf "$DIR"
[ -d "$DIR/.git" ] && exit 0

mkdir -p "$DIR"
cd "$DIR"
git init -q -b main
git config user.email playground@st-git
git config user.name playground
for i in 1 2 3 4 5; do echo $i >> f; git add f; git commit -qm "main commit $i"; done
git checkout -qb feature HEAD~2
for i in 1 2; do echo $i >> g; git add g; git commit -qm "feature work $i"; done
git checkout -q main
git merge -q --no-ff feature -m "Merge feature"
git tag v1.0
git checkout -qb fix HEAD~1
echo z > h; git add h; git commit -qm "hotfix"
git checkout -q main
for i in 6 7 8; do echo $i >> f; git add f; git commit -qm "main commit $i"; done
echo "playground created: $DIR"
