[![Build Status](https://img.shields.io/travis/com/tidepool-org/viz.svg)](https://travis-ci.com/tidepool-org/viz)

# @tidepool/viz

Tidepool data visualization for diabetes device data.

This README is focused on just the nuts & bolts of getting the code in this repository ready to develop locally in [blip](https://github.com/tidepool-org/blip 'GitHub: blip') or with [React Storybook](https://getstorybook.io/ 'React Storybook'). For more detailed information about the code in this repository, please see the [developer guide](./docs/StartHere.md).

#### Table of contents

- [Getting started](#getting-started)
- [Development](#development)
    - [Running locally with blip](#running-locally-with-blip)
    - [Running locally in React Storybook](#running-locally-in-react-storybook)
    - [Running the tests](#running-the-tests)
    - [Running the linter](#running-the-linter)
- [Production](#production)
    - [Publishing examples](#publishing-examples-to-github-pages-with-react-storybook)
    - [Publishing to npm](#building-and-publishing-to-npm)

* * * * *

## Getting started

After cloning this repository to your local machine, first make sure that you have at least node `6.x` and npm `4.x` installed. If you have a different major version of node installed, consider using [nvm](https://github.com/creationix/nvm 'GitHub: Node Version Manager') to manage and switch between multiple node (& npm) installations. If you have npm `3.x` installed (as it is by default with node `6.x`), then you can update to the latest npm `4.x` with `npm install -g npm@4`.

It's not an absolute requirement, but it is preferable to have [Yarn](https://yarnpkg.com 'Yarn') installed, as it provides dependency management features above and beyond what npm provides. Just follow [Yarn's installation instructions](https://yarnpkg.com/en/docs/install 'Yarn installation instructions') (hint: for Mac users with Homebrew installed, it's just `brew install yarn`).

Once your environment is setup with node `6.x` and npm `3.x` install the dependencies with Yarn:

```bash
$ yarn install
```

Or with npm if you're choosing not to use Yarn:

```bash
$ npm install
```

## Development

### Running locally with blip

To work on code in this repository within [blip](https://github.com/tidepool-org/blip 'Tidepool on GitHub: blip'), first run this command in your viz/ directory:

```bash
$ npm link 
```

This creates a "symlink" in the global folder {prefix}/lib/node_modules/\<package\>/ that links \<package\> to the viz/ directory.

Then, go to your local blip repository (assuming blip/ and viz/ are sister directories) and run:

```bash
$ npm link ../viz/
```

This creates a symbolic link from the global folder to the node_modules/ of the blip/ directory.

In this repository, start the build in watch mode:

```bash
$ npm start
```

Finally, back in your local blip repository, follow [the instructions for starting blip locally](https://github.com/tidepool-org/blip?tab=readme-ov-file#running-locally).

### Running locally in React Storybook

If you're working at the component or view level outside of blip, you can work on component and view rendering code with [React Storybook](https://github.com/kadirahq/react-storybook 'GitHub: react-storybook').

If you're working on the diabetes data model rendering components, run:

```bash
$ npm run typestories
```

If you're working on any other components or views, run:

```bash
$ npm run stories
```

For more about the use of React Storybook in this repo, see [use of React Storybook](http://developer.tidepool.io/viz/Storybook.html '@tidepool/viz docs: React Storybook').

### Running the tests

To run the unit tests in [PhantomJS](http://phantomjs.org/ 'PhantomJS') (as they run on [Travis CI](https://travis-ci.com/ 'Travis CI')):

```bash
$ npm test
```

To have the tests run continuously with source and test code changes rebundled as you work:

```bash
$ npm run test-watch
```

To run the unit tests in your local Chrome browser (recommended for Tidepool developers before merging or publishing a release):

```bash
$ npm run browser-tests
```

### Running the linter

To run the code linter from the command line:

```bash
$ npm run lint
```

Generally speaking, Tidepool developers configure linting to run continuously in their text editor of choice, and we recommend this approach for development. You can easily find instructions online for running ESLint continuously in all of the popular text editors—SublimeText, Atom, Visual Studio Code, etc.

## Production

### Publishing examples to GitHub Pages with React Storybook

See [the publishing section](docs/misc/Docs.md#publishing) of the docs on docs.

### Building and publishing to `npm`

When a new feature(s) is/are complete (i.e., branch is synchronized with master, reviewed with a sign-off from another developer), it's time to publish the package to npm! Since this is one of our most recently created repositories, any member of the "developers" team in the `@tidepool` npm organization will be able to publish the package using his or her npm login. Steps to publishing are as follows:

1. create a tag on the approved pull request using the `mversion` tool with the `-m` option to auto-commit the version bump and tag (e.g., `$ mversion patch -m` for a patch version bump)
1. push the new commit and tag to the GitHub remote with `$ git push origin <branch-name>` and `$ git push origin --tags`
1. check that the tag build has passed on [TravisCI](https://travis-ci.com/tidepool-org/viz)
1. `$ npm whoami` to check if you are logged in as yourself; if you are, skip to 7.
1. if you are logged in as `tidepool-robot`, log out with `$ npm logout`
1. then log in as yourself with `$ npm login`
1. publish the new version with `$ npm publish`; before the *actual* publish happens, the `yarn` install, linter, tests, and packaging webpack build will run since we have set those up through the `prepare` and `prepublishOnly` npm hooks in the package.json
1. merge the approved pull request to master
1. remember to bump the version appropriately in the package.json for the app (e.g., blip) requiring `@tidepool/viz` as a dependency!
