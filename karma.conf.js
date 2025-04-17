const path = require('path');
const webpackConf = require('./webpack.config.js');
const optional = require('optional');
const mochaConf = optional('./local/mocha.opts.json') || {};

webpackConf.externals = {
  cheerio: 'window',
  'react/addons': true,
  'react/lib/ExecutionEnvironment': true,
  'react/lib/ReactContext': true,
};

webpackConf.devtool = process.env.DEV_TOOL || false;
webpackConf.mode = 'development';

webpackConf.output = {
  path: path.join(__dirname, '/dist/'),
};

delete webpackConf.entry;

module.exports = function karmaConfig(config) {
  config.set({
    autoWatch: true,
    browserNoActivityTimeout: 60000,
    browsers: ['CustomChromeHeadless'],
    captureTimeout: 60000,
    client: {
      mocha: mochaConf,
    },
    colors: true,
    concurrency: Infinity,
    coverageReporter: {
      dir: 'coverage/',
      reporters: [
        { type: 'html' },
        { type: 'text' },
      ],
    },
    customLaunchers: {
      CustomChromeHeadless: {
        base: 'ChromeHeadless',
        flags: [
          '--headless',
          '--enable-automation',
          '--no-sandbox',
          '--remote-debugging-port=9222',
        ],
      },
    },
    files: [
      'loadtests.js',
    ],
    frameworks: ['webpack', 'mocha', 'chai', 'sinon', 'intl-shim'],
    logLevel: config.LOG_INFO,
    plugins: [
      'karma-webpack',
      'karma-sourcemap-loader',
      'karma-mocha',
      'karma-mocha-reporter',
      'karma-chai',
      'karma-sinon',
      'karma-intl-shim',
      'karma-chrome-launcher',
      'karma-coverage',
    ],
    preprocessors: {
      'loadtests.js': ['webpack', 'sourcemap'],
    },
    reporters: ['mocha', 'coverage'],
    singleRun: true,
    webpack: webpackConf,
    webpackMiddleware: {
      noInfo: true,
      stats: 'errors-only',
    },
  });
};
