import custom from './webpack.config.js';

const config = {
  framework: '@storybook/react-webpack5',
  stories: ['../stories/**/*.@(js|jsx|mjs|ts|tsx)'],

  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-knobs',
  ],

  features: {
    storyStoreV7: false,
  },

  webpackFinal: async (config) => {
    delete config.resolve.fallback.fs;

    const finalConfig = {
      ...config,
      module: { ...config.module, rules: [
        ...config.module.rules.filter(rule => {
          return rule.test
            ? rule.test.toString().indexOf('css') === -1 && rule.test.toString().indexOf('svg') === -1
            : true;
        }),
        ...custom.module.rules,
      ] },
      resolve: { ...config.resolve,
        alias: {
          ...config.resolve.alias,
          ...custom.resolve.alias,
        },
        fallback: {
          ...config.resolve.fallback,
          ...custom.resolve.fallback,
        },
      },
      plugins: [...config.plugins, ...custom.plugins],
      devtool: 'inline-source-map',
    };

    return finalConfig;
  },
};

export default config;
