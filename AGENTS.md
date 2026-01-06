# AGENTS.md

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

After implementing a feature or fix, suggest a commit message in imperative mood (e.g., "Add feature X to support Y").

## Git Command Restrictions

- **Only use read-only git commands** such as `git status`, `git log`, `git diff`, `git show`, `git branch -l`, `git remote -v`
- **Never run git commands that write or modify the git tree** such as `git commit`, `git push`, `git pull`, `git merge`, `git rebase`, `git checkout`, `git reset`, `git add`, `git rm`, `git stash`, `git cherry-pick`, `git revert`
