## @tidepool/viz's usage of webpack

Our use of [webpack](https://webpack.github.io/ 'webpack module bundler') in this repository is a bit different from our use of it in blip or the Tidepool uploader, where we're using it to build applications. Here we're using webpack to bundle our JavaScript, CSS, and JSON[^a] into a bundle that can be published to the [node package manager](http://npmjs.com/ 'npm') and then included as a dependency in other projects like blip.

While [the development webpack configuration](https://github.com/tidepool-org/viz/blob/master/webpack.config.js 'GitHub: viz webpack.config.js') is pretty similar to the configurations we used in blip and the uploader, [the production packaging configuration](https://github.com/tidepool-org/viz/blob/master/package.config.js 'GitHub: viz package.config.js') is different in that it specifies a `libraryTarget` and defines many of the dependencies as `externals` so that they don't get bundled twice (in both the viz JavaScript bundle and the blip bundle).

### A note on dependencies

The division between `devDependencies`, `dependencies`, and `peerDependencies` in this repository requires a bit of explanation.

We publish this repository as a package to the npm registry for use as a dependency in [blip](https://github.com/tidepool-org/blip). Some of the dependencies here are *also* dependencies of blip, but some of the added non-tooling (i.e., production) dependencies are unique to the visualization code. In general, we group the dependencies as follows:

**devDependencies**:
- dependencies for tooling and building
- dependencies for linting and testing
- dependencies that exist in blip

**peerDependencies**:
- dependencies that exist in blip

**dependencies**:
- dependencies that do *not* exist in blip

**In addition**, the webpack build for the npm package specifies *all* of the `dependencies` and `peerDependencies` (i.e., those shared with blip from the `devDependencies`) as `externals` in `package.config.js`. (This keeps the size of the @tidepool/viz library bundle as small as possible and prevents duplicated bundled external dependencies.) When you add a dependency of either kind, be sure to add it there as well, or the production build will be affected/bloated/potentially break! (You'll be fine in local development with all deps & devDeps installed, so consider yourself warned.)

[^a]: The timezone database that comes with [moment-timezone](http://momentjs.com/timezone/ 'Moment Timezone') is JSON.
