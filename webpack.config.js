const path = require('path');
const webpack = require('webpack');

const appDirectory = path.resolve(__dirname);
const isDev = (process.env.NODE_ENV === 'development');

// Enzyme as of v2.4.1 has trouble with classes
// that do not start and *end* with an alpha character
// but that will sometimes happen with the base64 hashes
// so we leave them off in the test env
const localIdentName = process.env.NODE_ENV === 'test'
  ? '[name]--[local]'
  : '[name]--[local]--[hash:base64:5]';

const styleLoaderConfiguration = {
  test: /\.css$/,
  use: [
    'style-loader',
    {
      loader: 'css-loader?sourceMap',
      query: {
        importLoaders: 1,
        localIdentName,
        modules: true,
        sourceMap: true,
      },
    },
    {
      loader: 'postcss-loader',
      options: {
        sourceMap: true,
      },
    },
  ],
};

const babelLoaderConfiguration = {
  test: /\.js$/,
  include: [
    // Add every directory that needs to be compiled by babel during the build
    path.resolve(appDirectory, 'src'),
    path.resolve(appDirectory, 'test'),
    path.resolve(appDirectory, 'data'),
  ],
  use: [
    {
      loader: 'babel-loader',
      options: {
        cacheDirectory: true,
      },
    },
  ],
};

// This is needed for webpack to import static images in JavaScript files
const imageLoaderConfiguration = {
  test: /\.(gif|jpe?g|png|svg)$/,
  use: {
    loader: 'url-loader',
    options: {
      name: '[name].[ext]',
    },
  },
};

const fontLoaderConfiguration = [
  {
    test: /\.eot$/,
    use: {
      loader: 'url-loader',
      query: {
        limit: 10000,
        mimetype: 'application/vnd.ms-fontobject',
      },
    },
  },
  {
    test: /\.woff$/,
    use: {
      loader: 'url-loader',
      query: {
        limit: 10000,
        mimetype: 'application/font-woff',
      },
    },
  },
  {
    test: /\.ttf$/,
    use: {
      loader: 'url-loader',
      query: {
        limit: 10000,
        mimetype: 'application/octet-stream',
      },
    },
  },
];

const plugins = [
  // `process.env.NODE_ENV === 'production'` must be `true` for production
  // builds to eliminate development checks and reduce build size. You may
  // wish to include additional optimizations.
  new webpack.DefinePlugin({
    __DEV__: isDev,
  }),
  new webpack.LoaderOptionsPlugin({
    debug: true,
  }),
];

const entry = {
  index: [path.join(__dirname, '/src/index')],
  data: [path.join(__dirname, '/src/modules/data/index')],
  print: [path.join(__dirname, '/src/modules/print/index')],
  genAGPURL: [path.join(__dirname, '/src/utils/print/plotly')],
};

const output = {
  filename: '[name].js',
  path: path.join(__dirname, '/dist/'),
};

const resolve = {
  alias: {
    crossfilter: 'crossfilter2',
  },
  extensions: [
    '.js',
  ],
};

let devtool = process.env.WEBPACK_DEVTOOL_VIZ || 'cheap-source-map';
if (process.env.WEBPACK_DEVTOOL_VIZ === false) devtool = undefined;

module.exports = {
  cache: isDev,
  devtool: isDev ? devtool : 'source-map',
  entry,
  mode: isDev ? 'development' : 'production',
  module: {
    rules: [
      babelLoaderConfiguration,
      imageLoaderConfiguration,
      styleLoaderConfiguration,
      ...fontLoaderConfiguration,
    ],
  },
  output,
  plugins,
  resolve,
};
