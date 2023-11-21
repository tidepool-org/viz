const webpack = require('webpack');
const _ = require('lodash');

const baseConfig = require('./webpack.config');
const packageConfig = _.cloneDeep(baseConfig);

// eslint-disable-next-line no-underscore-dangle
const __DEV__ = process.env.NODE_ENV === 'development';

packageConfig.output.libraryTarget = 'commonjs';

packageConfig.externals = {
  bluebird: 'bluebird',
  bows: 'bows',
  'browserify-zlib': 'browserify-zlib',
  buffer: 'buffer',
  classnames: 'classnames',
  crossfilter2: 'crossfilter2',
  'd3-array': 'd3-array',
  'd3-format': 'd3-format',
  'd3-scale': 'd3-scale',
  'd3-shape': 'd3-shape',
  'd3-time': 'd3-time',
  'd3-time-format': 'd3-time-format',
  emotion: 'emotion',
  events: 'events',
  'fastest-validator': 'fastest-validator',
  gsap: 'gsap',
  i18next: 'i18next',
  intl: 'intl',
  'intl-pluralrules': 'intl-pluralrules',
  lodash: 'lodash',
  memorystream: 'memorystream',
  moment: 'moment',
  'moment-timezone': 'moment-timezone',
  'parse-svg-path': 'parse-svg-path',
  process: 'process',
  'prop-types': 'prop-types',
  react: 'react',
  'react-clipboard.js': 'react-clipboard.js',
  'react-collapse': 'react-collapse',
  'react-dimensions': 'react-dimensions',
  'react-dom': 'react-dom',
  'react-markdown': 'react-markdown',
  'react-motion': 'react-motion',
  'react-redux': 'react-redux',
  'react-select': 'react-select',
  'react-sizeme': 'react-sizeme',
  'react-transition-group-plus': 'react-transition-group-plus',
  'readable-stream': 'readable-stream',
  reductio: 'reductio',
  redux: 'redux',
  'serialize-svg-path': 'serialize-svg-path',
  sundial: 'sundial',
  'svg-to-pdfkit': 'svg-to-pdfkit',
  'text-table': 'text-table',
  'translate-svg-path': 'translate-svg-path',
  util: 'util',
  victory: 'victory',
  'voilab-pdf-table': 'voilab-pdf-table',
};

packageConfig.plugins = [
  new webpack.DefinePlugin({
    __DEV__,
  }),
];

packageConfig.mode = 'production';

module.exports = packageConfig;
