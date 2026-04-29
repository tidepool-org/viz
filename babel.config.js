module.exports = function babelConfig(api) {
  // babel-preset-react-app requires NODE_ENV or BABEL_ENV to be set.
  // When running via ESLint on Windows, the Unix-style env assignment in the
  // lint script doesn't propagate, so we fall back to api.env() here.
  if (!process.env.NODE_ENV && !process.env.BABEL_ENV) {
    process.env.BABEL_ENV = api.env() || 'development';
  }

  const presets = [
    '@babel/preset-env',
    '@babel/preset-react',
    'babel-preset-react-app',
  ];

  const plugins = [
    'react-hot-loader/babel',
    '@babel/plugin-transform-modules-commonjs',
  ];

  const env = api.env();

  if (env === 'test') {
    plugins.unshift(
      ['babel-plugin-istanbul', {
        useInlineSourceMaps: false,
      }]
    );
  }

  return {
    presets,
    plugins,
  };
};
