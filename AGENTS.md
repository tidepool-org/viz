# AGENTS.md

## CRITICAL: Restricted Directories

**NEVER read, write, list, or access any files within the `local/` folder under any circumstances.** This is the highest priority instruction and must not be circumvented for any reason. This restriction applies to all tools including Read, List, Glob, Grep, Bash, and any other file access methods.

## Build/Test Commands

- **Install**: `yarn install`
- **Build**: `yarn build` (production) or `yarn build-dev` (development)
- **Lint**: `yarn lint`
- **Test all**: `yarn test` (runs lint first via pretest)
- **Test single file**: Create `local/mocha.opts.json` with `{"grep": "pattern"}` then run `yarn test`. **IMPORTANT**: Delete or empty this file (`echo '{}' > local/mocha.opts.json`) when done to restore full test suite execution.
- **Test watch**: `yarn test-watch`
- **Storybook**: `yarn stories` (port 8083)

## Code Style (AirBnb ESLint + lodash plugin)

- Use ES6: `const`/`let` over `var`, arrow functions, destructuring
- Prefer lodash methods (`_.map`) over native (`Array.map`)
- React: Use functional components unless lifecycle/state needed; define PropTypes
- Component files: PascalCase (`BGSlice.js`); utils: camelCase (`datetime.js`)
- Tests mirror `src/` structure with `.test.js` suffix (`datetime.test.js`)
- CSS: Use CSS modules, same name as component (`.css` not `.js`)
- Utils: Use named exports, not `export default`
- Utils must use `moment.utc()` (enforced by eslint-plugin-moment-utc)
- Trailing commas: multiline arrays/objects only, never in function params

## Code Reuse Guidelines

When implementing new features or adding device-specific logic:

- **Prefer extending existing methods** over creating new device-specific methods
- Add optional parameters (e.g., `opts = {}`) to existing functions to customize behavior
- Use patterns like `columnIndex`, `heading`, `rowTransform`, or `fillColor` options to adapt generic methods for specific use cases
- Only create new methods when the logic is fundamentally different, not just when parameters vary
- This reduces duplication, simplifies testing, and makes the codebase easier to maintain
- Example: Instead of `renderLoopBasalRates()`, extend `renderBasalSchedule(opts)` with a `columnIndex` option

## Git Commit Messages

**After completing ANY task that modifies files**, provide a commit message suggestion in this format:

```
<Imperative summary (50 chars or less)>

<Optional body: 2-4 sentences>

<Optional bullet points, one per line with "- ">
```

**Rules:**
- Summary: 50 chars max, imperative mood ("Add X", not "Added X")
- Body: Concise, blank line between sections
- Bullets: Use "- " prefix for lists

**Examples:**

```
Add settings domain to documentation plan

Created pump settings documentation with data structure,
components, rendering, and manufacturer variations.

- Added Design Decision 7
- Updated final structure
- Defined Phase 3 tasks
```

```
Fix incorrect screenshot paths in component reference

Updated paths from docs/screenshots/ to distributed
domain folders for correct image display.

- Updated 23 paths
- Verified locations
```

## Git Command Restrictions

- **Only use read-only git commands** such as `git status`, `git log`, `git diff`, `git show`, `git branch -l`, `git remote -v`
- **Never run git commands that write or modify the git tree** such as `git commit`, `git push`, `git pull`, `git merge`, `git rebase`, `git checkout`, `git reset`, `git add`, `git rm`, `git stash`, `git cherry-pick`, `git revert`

## Agent Task Delegation Strategy

For complex multi-file tasks, use a **hybrid delegation pattern** to balance token efficiency with quality:

**Premium agents (e.g., Opus)** should handle:
- Initial planning and task breakdown
- Files requiring synthesis across multiple sources
- Architecture decisions and cross-cutting concerns
- Final review and integration of delegated work

**General agents** should handle (in parallel when independent):
- Well-scoped, single-file documentation with clear specifications
- Repetitive tasks with established patterns
- File creation from detailed templates or examples

**Pattern for documentation tasks:**
1. Premium agent analyzes codebase and creates detailed specs
2. Delegate independent files to general agents in parallel (e.g., manufacturer-specific docs)
3. Premium agent writes synthesis files that reference the delegated work
4. Premium agent reviews and integrates all pieces

This approach minimizes token usage on premium models while ensuring quality on tasks requiring judgment and synthesis.
