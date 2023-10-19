module.exports = function babelConfig(api) {
  const presets = [
    '@babel/preset-env',
    // '@babel/preset-react',
    [
      "@babel/preset-react",
      {
        "pragma": "dom", // default pragma is React.createElement (only in classic runtime)
        "pragmaFrag": "DomFrag", // default is React.Fragment (only in classic runtime)
        "throwIfNamespace": false, // defaults to true
        "runtime": "classic" // defaults to classic
        // "importSource": "custom-jsx-library" // defaults to react (only in automatic runtime)
      }
    ]
    // 'babel-preset-react-app',
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

  api.cache(true);

  return {
    presets,
    plugins,
  };
};
