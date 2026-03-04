/* eslint-disable global-require */
// eslint-disable-next-line no-unused-vars
/* global jest, beforeAll, afterAll, describe */

// Ensure NODE_ENV is set for babel-preset-react-app before any modules load
process.env.NODE_ENV = process.env.NODE_ENV || 'test';

// Add any global setup for Jest tests here
// Use require (not static import) so NODE_ENV is already set when core-js loads
require('core-js/stable');

// Setup Intl polyfill
global.IntlPolyfill = require('intl');
require('intl/locale-data/jsonp/en.js');
require('intl-pluralrules');

// Setup i18next
const i18next = require('i18next');
const _ = require('lodash');

if (_.get(i18next, 'options.returnEmptyString') === undefined) {
  i18next.init({ returnEmptyString: false, nsSeparator: '|' });
}

// Setup Jest DOM matchers
require('@testing-library/jest-dom');

// Polyfill webpack's require.context for Jest
if (typeof require.context === 'undefined') {
  const fs = require('fs');
  const path = require('path');

  require.context = function (base, deep, filter) {
    const baseDir = path.resolve(__dirname, base.replace(/^\//, ''));
    const files = [];

    function readDir(dir) {
      if (!fs.existsSync(dir)) return;
      fs.readdirSync(dir).forEach((file) => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory() && deep) {
          readDir(fullPath);
        } else {
          const relativePath = `./${path.relative(baseDir, fullPath).replace(/\\/g, '/')}`;
          if (filter.test(relativePath)) {
            files.push(relativePath);
          }
        }
      });
    }

    readDir(baseDir);

    const context = function (key) {
      return require(path.join(baseDir, key));
    };
    context.keys = function () {
      return files;
    };
    return context;
  };
}

// Make chai and sinon available globally (matching Karma/Mocha globals)
global.chai = require('chai');
global.sinon = require('sinon');
global.assert = global.chai.assert;
global.expect = global.chai.expect;

// Map Mocha lifecycle hooks to Jest equivalents
global.before = beforeAll;
global.after = afterAll;
global.context = describe;

// Define global variables that might be expected by app code
// eslint-disable-next-line no-underscore-dangle
global.__DEV__ = true;
