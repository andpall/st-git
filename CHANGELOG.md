# Changelog

## 0.1.2

- "Merge into Current Branch" in the Log commit context menu
- Log graph width fits the branches visible on screen and is capped at 8 lanes by default
- Log columns (graph, author, date) are resizable by dragging the dividers; widths are remembered
- Log shows commit time without seconds; author and date are hidden in panels narrower than 480px (was 520px)

## 0.1.1

- Changes and Local Changes: folders with a single subfolder are shown on one line, like `src/modules/log`
- Activity Bar icon shows the number of local changes
- "Add to .gitignore" in the Local Changes context menu for unversioned files and folders

## 0.1.0

- Log: search by text or hash, filters by branch, user and date, "Load more commits"
- Annotate with Git Blame in the editor and line numbers context menu, hover with "Show in Log"
- Show Git History for a file (explorer, editor and tab context menus)
- Git asks for username, password or SSH passphrase in VS Code instead of failing (macOS, Linux)
- Branch name check catches conflicts like "feature" vs "feature/x"
- Merge editor opens correctly when the project path goes through a symlink
- Status bar shows a running rebase, merge, cherry-pick or revert
- Larger Log panel by default

## 0.0.1

- First release: commit graph, local changes and commit, branches, stashes, rebase and conflict resolution, history editing (undo, squash, drop, reword, cherry-pick, revert)
