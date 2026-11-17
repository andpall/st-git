#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

set -a
[ -f .env ] && source .env
set +a

if [ -z "${VSCE_PAT:-}" ] && [ -z "${OVSX_PAT:-}" ]; then
  echo "No tokens in .env: set VSCE_PAT and/or OVSX_PAT" >&2
  exit 1
fi

version=$(node -p 'require("./package.json").version')
vsix="st-git-$version.vsix"

npm test
npx @vscode/vsce package -o "$vsix"

if [ -n "${VSCE_PAT:-}" ]; then
  npx @vscode/vsce publish --packagePath "$vsix"
else
  echo "VSCE_PAT not set: upload $vsix manually at https://marketplace.visualstudio.com/manage"
fi

if [ -n "${OVSX_PAT:-}" ]; then
  npx ovsx publish "$vsix"
else
  echo "OVSX_PAT not set: skipped Open VSX"
fi
