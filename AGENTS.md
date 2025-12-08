# AGENTS.md

## Build/Test Commands
- **Install**: `yarn install`
- **Build**: `yarn build` (production) or `yarn build-dev` (development)
- **Lint**: `yarn lint`
- **Test all**: `yarn test` (runs lint first via pretest)
- **Test single file**: Create `local/mocha.opts.json` with `{"grep": "pattern"}` then run `yarn test`
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
